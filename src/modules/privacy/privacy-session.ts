export type IdentityKind = 'NAME' | 'EMAIL' | 'PHONE' | 'ADDRESS';

export interface KnownIdentity {
  kind: IdentityKind;
  value: string;
}

const PATTERNS: ReadonlyArray<{ kind: IdentityKind; re: RegExp }> = [
  { kind: 'EMAIL', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { kind: 'PHONE', re: /\+?\d[\d\s-]{8,}\d/g },
];

const PLACEHOLDER_RE = /\[MASKED_PII_(NAME|EMAIL|PHONE|ADDRESS)_(\d+)\]/g;
const LOOSE_PLACEHOLDER_RE = /\[\s*MASK(?:ED)?[^\]]*\]/gi;

export class PrivacySession {
  private readonly toPlaceholder = new Map<string, string>();
  private readonly toOriginal = new Map<string, string>();
  private readonly counters = new Map<IdentityKind, number>();

  constructor(identities: readonly KnownIdentity[]) {
    // Assigned in input order, so placeholder numbering matches the order
    // identities were provided in. Substring-safety during replacement is
    // handled separately in pseudonymize(), which sorts by length there.
    for (const id of identities) this.assign(id.kind, id.value);
  }

  private assign(kind: IdentityKind, value: string): string {
    const existing = this.toPlaceholder.get(value);
    if (existing !== undefined) return existing;

    const next = (this.counters.get(kind) ?? 0) + 1;
    this.counters.set(kind, next);
    const placeholder = `[MASKED_PII_${kind}_${next}]`;
    this.toPlaceholder.set(value, placeholder);
    this.toOriginal.set(placeholder, value);
    return placeholder;
  }

  pseudonymize(text: string): string {
    let out = text;

    // Known values first, longest to shortest.
    const known = [...this.toPlaceholder.keys()].sort(
      (a, b) => b.length - a.length,
    );
    for (const value of known) {
      const placeholder = this.toPlaceholder.get(value);
      if (placeholder !== undefined) out = out.split(value).join(placeholder);
    }

    // Then patterns, to catch values absent from the context.
    for (const { kind, re } of PATTERNS) {
      out = out.replace(new RegExp(re.source, re.flags), (match) =>
        this.assign(kind, match),
      );
    }

    return out;
  }

  restore(text: string): string {
    let out = text;
    for (const [placeholder, original] of this.toOriginal) {
      out = out.split(placeholder).join(original);
    }
    return out;
  }

  /**
   * True when the text contains a placeholder-like token that this session
   * cannot restore — either malformed, or well-formed with an index never
   * issued. Such a turn must be rejected: the value cannot be recovered and
   * could reach the customer verbatim.
   */
  containsResidue(text: string): boolean {
    const wellFormed = new Set<string>();
    for (const m of text.matchAll(PLACEHOLDER_RE)) wellFormed.add(m[0]);
    for (const p of wellFormed) {
      if (!this.toOriginal.has(p)) return true;
    }

    for (const m of text.matchAll(LOOSE_PLACEHOLDER_RE)) {
      if (!wellFormed.has(m[0])) return true;
    }

    return false;
  }

  get placeholders(): ReadonlyMap<string, string> {
    return this.toOriginal;
  }
}

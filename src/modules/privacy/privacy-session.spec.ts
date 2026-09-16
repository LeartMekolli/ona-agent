import { PrivacySession, type KnownIdentity } from './privacy-session';

const identities: KnownIdentity[] = [
  { kind: 'NAME', value: 'Sam' },
  { kind: 'NAME', value: 'Samantha Okafor' },
  { kind: 'EMAIL', value: 'sam@example.invalid' },
  { kind: 'PHONE', value: '+447700900123' },
  { kind: 'ADDRESS', value: '12 Oak Lane, Leeds, LS1 4AB' },
];

describe('PrivacySession', () => {
  it('replaces a known name with a placeholder', () => {
    const s = new PrivacySession(identities);
    expect(s.pseudonymize('Hello Sam')).toBe('Hello [MASKED_PII_NAME_1]');
  });

  it('replaces longer originals first so substrings are not corrupted', () => {
    const s = new PrivacySession(identities);
    const out = s.pseudonymize('Samantha Okafor ordered it, Sam paid.');
    expect(out).not.toContain('Samantha');
    expect(out).not.toContain('Okafor');
    // "Samantha Okafor" must map to its own placeholder, not "[MASK]antha Okafor"
    const [first] = out.split(' ');
    expect(first).toMatch(/^\[MASKED_PII_NAME_\d+\]$/);
  });

  it('round-trips losslessly', () => {
    const s = new PrivacySession(identities);
    const original =
      'Sam at sam@example.invalid, +447700900123, 12 Oak Lane, Leeds, LS1 4AB';
    expect(s.restore(s.pseudonymize(original))).toBe(original);
  });

  it('assigns a stable placeholder to repeated occurrences', () => {
    const s = new PrivacySession(identities);
    const out = s.pseudonymize('Sam and Sam again');
    const ids = out.match(/\[MASKED_PII_NAME_\d+\]/g);
    expect(ids).toHaveLength(2);
    expect(ids?.[0]).toBe(ids?.[1]);
  });

  it('catches an email not in the known set, by pattern', () => {
    const s = new PrivacySession(identities);
    const out = s.pseudonymize('Forward to other@example.invalid');
    expect(out).not.toContain('other@example.invalid');
    expect(out).toContain('[MASKED_PII_EMAIL_');
  });

  it('detects a mangled placeholder as residue', () => {
    const s = new PrivacySession(identities);
    s.pseudonymize('Hello Sam');
    expect(s.containsResidue('Hi [MASKED_NAME1], thanks')).toBe(true);
    expect(s.containsResidue('Hi [MASKED_PII_NAME_1], thanks')).toBe(false);
  });

  it('treats an unknown placeholder index as residue', () => {
    const s = new PrivacySession(identities);
    s.pseudonymize('Hello Sam');
    expect(s.containsResidue('Hi [MASKED_PII_NAME_99]')).toBe(true);
  });

  it('reports no residue for text containing no placeholders', () => {
    const s = new PrivacySession(identities);
    expect(s.containsResidue('Your parcel is on its way.')).toBe(false);
  });
});

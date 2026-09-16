import type { ProviderName } from '../providers/provider.interface';

const SHARED = [429, 500, 502, 503, 504] as const;

export const RETRYABLE_STATUS: Readonly<
  Record<ProviderName, ReadonlySet<number>>
> = {
  anthropic: new Set([...SHARED, 529]), // 529 = overloaded_error, Anthropic-specific
  openai: new Set(SHARED),
};

/** An undefined status code means a network-level failure, which is retryable. */
export function isRetryable(
  provider: ProviderName,
  statusCode: number | undefined,
): boolean {
  if (statusCode === undefined) return true;
  return RETRYABLE_STATUS[provider].has(statusCode);
}

export function extractStatusCode(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as Record<string, unknown>;
  for (const key of ['status', 'statusCode', 'code']) {
    const v = e[key];
    if (typeof v === 'number') return v;
  }
  const response = e['response'];
  if (typeof response === 'object' && response !== null) {
    const s = (response as Record<string, unknown>)['status'];
    if (typeof s === 'number') return s;
  }
  return undefined;
}

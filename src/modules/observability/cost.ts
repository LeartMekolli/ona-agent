import type { UnifiedUsage } from '../llm/types';

interface Pricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheWriteMultiplier: number;
  cacheReadMultiplier: number;
}

const PRICING: Readonly<Record<string, Pricing>> = {
  'claude-opus-5': {
    inputPerMTok: 5,
    outputPerMTok: 25,
    cacheWriteMultiplier: 1.25,
    cacheReadMultiplier: 0.1,
  },
  'claude-haiku-4-5': {
    inputPerMTok: 1,
    outputPerMTok: 5,
    cacheWriteMultiplier: 1.25,
    cacheReadMultiplier: 0.1,
  },
  'gpt-4o': {
    inputPerMTok: 2.5,
    outputPerMTok: 10,
    cacheWriteMultiplier: 1,
    cacheReadMultiplier: 0.5,
  },
  'gpt-4o-mini': {
    inputPerMTok: 0.15,
    outputPerMTok: 0.6,
    cacheWriteMultiplier: 1,
    cacheReadMultiplier: 0.5,
  },
};

const MILLION = 1_000_000;

export function costOf(model: string, usage: UnifiedUsage): number {
  const p = PRICING[model];
  if (p === undefined) return 0;
  return (
    (usage.inputTokens / MILLION) * p.inputPerMTok +
    (usage.outputTokens / MILLION) * p.outputPerMTok +
    (usage.cacheCreationInputTokens / MILLION) *
      p.inputPerMTok *
      p.cacheWriteMultiplier +
    (usage.cacheReadInputTokens / MILLION) *
      p.inputPerMTok *
      p.cacheReadMultiplier
  );
}

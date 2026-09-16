import type { Effort } from '../types';
import type { ProviderName } from '../providers/provider.interface';

export interface ProviderConfig {
  provider: ProviderName;
  model: string;
  effort?: Effort;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export interface ModelStack {
  primary: ProviderConfig;
  fallback: ProviderConfig;
}

const GENERATION_TIMEOUT_MS = 90_000;
const VALIDATION_TIMEOUT_MS = 45_000;

export const MODEL_STACKS: Readonly<
  Record<'generation' | 'validation' | 'knowledge' | 'judge', ModelStack>
> = {
  generation: {
    primary: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      effort: 'high',
      maxRetries: 2,
      retryDelayMs: 1000,
      timeoutMs: GENERATION_TIMEOUT_MS,
    },
    fallback: {
      provider: 'openai',
      model: 'gpt-4o',
      maxRetries: 1,
      retryDelayMs: 1000,
      timeoutMs: GENERATION_TIMEOUT_MS,
    },
  },
  validation: {
    primary: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      effort: 'low',
      maxRetries: 2,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
    fallback: {
      provider: 'openai',
      model: 'gpt-4o',
      maxRetries: 1,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
  },
  knowledge: {
    primary: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      maxRetries: 2,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
    fallback: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxRetries: 1,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
  },
  judge: {
    primary: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      maxRetries: 2,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
    fallback: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxRetries: 1,
      retryDelayMs: 500,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    },
  },
};

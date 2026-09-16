import type { ProviderName } from '../providers/provider.interface';

export interface LLMAttempt {
  provider: ProviderName;
  model: string;
  attemptNumber: number;
  isFallback: boolean;
  errorCode?: string | number;
  startedAt: Date;
  finishedAt: Date;
}

export interface LLMResilientResult<T> {
  data: T | null;
  allFailed: boolean;
  attempts: readonly LLMAttempt[];
  servingProvider?: ProviderName;
  servingModel?: string;
}

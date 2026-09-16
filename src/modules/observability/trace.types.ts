import type { UnifiedUsage } from '../llm/types';
import type { LLMAttempt } from '../llm/resilience/resilient.types';

export interface GenerationDetail {
  name: string;
  model: string;
  input: unknown;
  output: unknown;
  usage: UnifiedUsage;
  metadata?: Record<string, unknown>;
}

export interface RunTrace {
  readonly id: string;
  generation(detail: GenerationDetail): void;
  recordFailedAttempts(attempts: readonly LLMAttempt[]): void;
  end(output: Record<string, unknown>): Promise<void>;
}

import { Injectable } from '@nestjs/common';
import type { Langfuse } from 'langfuse';
import { PrivacyService } from '../privacy/privacy.service';
import { costOf } from './cost';
import type { GenerationDetail, RunTrace } from './trace.types';
import type { LLMAttempt } from '../llm/resilience/resilient.types';

@Injectable()
export class OnaLangfuseService {
  constructor(
    private readonly client: Langfuse,
    private readonly privacy: PrivacyService,
  ) {}

  startRun(input: {
    name: string;
    triggerId: string;
    metadata?: Record<string, unknown>;
  }): RunTrace {
    const trace = this.client.trace({
      name: input.name,
      metadata: { triggerId: input.triggerId, ...input.metadata },
    }) as unknown as {
      id: string;
      generation: (d: Record<string, unknown>) => void;
      update: (d: Record<string, unknown>) => void;
    };

    const privacy = this.privacy;
    const client = this.client;

    return {
      id: trace.id,

      generation(detail: GenerationDetail): void {
        trace.generation({
          name: detail.name,
          model: detail.model,
          input: privacy.sanitizeForTrace(detail.input),
          output: privacy.sanitizeForTrace(detail.output),
          usage: {
            input: detail.usage.inputTokens,
            output: detail.usage.outputTokens,
          },
          metadata: {
            ...detail.metadata,
            costUsd: costOf(detail.model, detail.usage),
          },
        });
      },

      /** Failed attempts are replayed at ERROR level so a silent failover shows in the trace. */
      recordFailedAttempts(attempts: readonly LLMAttempt[]): void {
        for (const a of attempts) {
          if (a.errorCode === undefined) continue;
          trace.generation({
            name: `${a.provider}-attempt-${a.attemptNumber}${a.isFallback ? '-fallback' : ''}`,
            model: a.model,
            level: 'ERROR',
            statusMessage: String(a.errorCode),
            startTime: a.startedAt,
            endTime: a.finishedAt,
          });
        }
      },

      async end(output: Record<string, unknown>): Promise<void> {
        trace.update({ output: privacy.sanitizeForTrace(output) });
        await client.flushAsync();
      },
    };
  }
}

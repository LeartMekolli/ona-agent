import { Injectable } from '@nestjs/common';
import type { LLMProvider } from '../providers/provider.interface';
import type { UnifiedLLMRequest, UnifiedLLMResponse } from '../types';
import type { ModelStack, ProviderConfig } from './model-stacks.constants';
import type { LLMAttempt, LLMResilientResult } from './resilient.types';
import { extractStatusCode, isRetryable } from './retry-policy.constants';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

@Injectable()
export class LLMResilientService {
  constructor(
    private readonly anthropic: LLMProvider,
    private readonly openai: LLMProvider,
  ) {}

  private providerFor(cfg: ProviderConfig): LLMProvider {
    return cfg.provider === 'anthropic' ? this.anthropic : this.openai;
  }

  async executeWithFallback<T>(
    requestBuilder: (cfg: ProviderConfig) => UnifiedLLMRequest,
    responseParser: (res: UnifiedLLMResponse) => T | null,
    stack: ModelStack,
  ): Promise<LLMResilientResult<T>> {
    const attempts: LLMAttempt[] = [];

    for (const [cfg, isFallback] of [
      [stack.primary, false],
      [stack.fallback, true],
    ] as const) {
      const outcome = await this.runProvider(
        cfg,
        isFallback,
        requestBuilder,
        responseParser,
        attempts,
      );
      if (outcome !== null) {
        return {
          data: outcome,
          allFailed: false,
          attempts,
          servingProvider: cfg.provider,
          servingModel: cfg.model,
        };
      }
    }

    return { data: null, allFailed: true, attempts };
  }

  private async runProvider<T>(
    cfg: ProviderConfig,
    isFallback: boolean,
    requestBuilder: (cfg: ProviderConfig) => UnifiedLLMRequest,
    responseParser: (res: UnifiedLLMResponse) => T | null,
    attempts: LLMAttempt[],
  ): Promise<T | null> {
    const provider = this.providerFor(cfg);

    for (
      let attemptNumber = 1;
      attemptNumber <= cfg.maxRetries + 1;
      attemptNumber++
    ) {
      const startedAt = new Date();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

      try {
        // Built per provider config, so primary and fallback can carry
        // different reasoning parameters without the caller branching.
        const request = requestBuilder(cfg);
        const response = await provider.send(
          request,
          cfg.model,
          controller.signal,
        );
        const parsed = responseParser(response);

        if (parsed === null || parsed === undefined) {
          attempts.push({
            provider: cfg.provider,
            model: cfg.model,
            attemptNumber,
            isFallback,
            errorCode: 'parse_failed',
            startedAt,
            finishedAt: new Date(),
          });
          if (attemptNumber > cfg.maxRetries) return null;
          await sleep(cfg.retryDelayMs);
          continue;
        }

        attempts.push({
          provider: cfg.provider,
          model: cfg.model,
          attemptNumber,
          isFallback,
          startedAt,
          finishedAt: new Date(),
        });
        return parsed;
      } catch (err) {
        const statusCode = extractStatusCode(err);
        attempts.push({
          provider: cfg.provider,
          model: cfg.model,
          attemptNumber,
          isFallback,
          errorCode: statusCode ?? 'network_error',
          startedAt,
          finishedAt: new Date(),
        });
        if (!isRetryable(cfg.provider, statusCode)) return null;
        if (attemptNumber > cfg.maxRetries) return null;
        await sleep(cfg.retryDelayMs);
      } finally {
        clearTimeout(timer);
      }
    }

    return null;
  }
}

import { LLMResilientService } from './llm-resilient.service';
import type { ModelStack, ProviderConfig } from './model-stacks.constants';
import type { LLMProvider } from '../providers/provider.interface';
import type { UnifiedLLMResponse } from '../types';

const ok = (model: string): UnifiedLLMResponse => ({
  text: 'ok',
  toolCalls: [],
  stopReason: 'end_turn',
  model,
  usage: {
    inputTokens: 1,
    outputTokens: 1,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  },
});

const stack: ModelStack = {
  primary: {
    provider: 'anthropic',
    model: 'claude-opus-5',
    effort: 'high',
    maxRetries: 2,
    retryDelayMs: 1,
    timeoutMs: 50,
  },
  fallback: {
    provider: 'openai',
    model: 'gpt-4o',
    maxRetries: 1,
    retryDelayMs: 1,
    timeoutMs: 50,
  },
};

const fakeProvider = (
  name: 'anthropic' | 'openai',
  send: jest.Mock,
): LLMProvider => ({ name, send }) as unknown as LLMProvider;

const builder = () => ({
  messages: [{ role: 'user' as const, content: 'hi' }],
  maxTokens: 100,
});
const parser = (r: UnifiedLLMResponse) => r.text;

describe('LLMResilientService', () => {
  it('returns the primary result on first success', async () => {
    const a = jest.fn().mockResolvedValue(ok('claude-opus-5'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', jest.fn()),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);

    expect(res.data).toBe('ok');
    expect(res.allFailed).toBe(false);
    expect(res.attempts).toHaveLength(1);
    expect(res.servingProvider).toBe('anthropic');
  });

  it('retries a retryable status then succeeds', async () => {
    const a = jest
      .fn()
      .mockRejectedValueOnce({ status: 529 })
      .mockResolvedValue(ok('claude-opus-5'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', jest.fn()),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);

    expect(res.data).toBe('ok');
    expect(res.attempts).toHaveLength(2);
    expect(res.attempts[0]?.errorCode).toBe(529);
  });

  it('does not retry a non-retryable status; goes straight to fallback', async () => {
    const a = jest.fn().mockRejectedValue({ status: 400 });
    const o = jest.fn().mockResolvedValue(ok('gpt-4o'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', o),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);

    expect(a).toHaveBeenCalledTimes(1);
    expect(res.data).toBe('ok');
    expect(res.servingProvider).toBe('openai');
    expect(
      res.attempts.some((x: { isFallback: boolean }) => x.isFallback),
    ).toBe(true);
  });

  it('treats an undefined status code as a retryable network error', async () => {
    const a = jest
      .fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValue(ok('claude-opus-5'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', jest.fn()),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);
    expect(res.data).toBe('ok');
    expect(res.attempts).toHaveLength(2);
  });

  it('counts a null parse as a failed attempt', async () => {
    const a = jest.fn().mockResolvedValue(ok('claude-opus-5'));
    const o = jest.fn().mockResolvedValue(ok('gpt-4o'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', o),
    );
    const res = await svc.executeWithFallback(builder, () => null, stack);

    expect(res.data).toBeNull();
    expect(res.allFailed).toBe(true);
    expect(res.attempts.length).toBeGreaterThan(1);
  });

  it('gives up with allFailed when both providers fail', async () => {
    const a = jest.fn().mockRejectedValue({ status: 500 });
    const o = jest.fn().mockRejectedValue({ status: 500 });
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', o),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);

    expect(res.data).toBeNull();
    expect(res.allFailed).toBe(true);
    expect(res.attempts).toHaveLength(5); // 3 primary + 2 fallback
  });

  it('aborts an attempt that exceeds the timeout', async () => {
    const a = jest.fn().mockImplementation(
      (_r, _m, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const o = jest.fn().mockResolvedValue(ok('gpt-4o'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', o),
    );
    const res = await svc.executeWithFallback(builder, parser, stack);

    expect(res.data).toBe('ok');
    expect(res.servingProvider).toBe('openai');
  });

  it('gives the fallback a request built from the fallback config', async () => {
    const a = jest.fn().mockRejectedValue({ status: 500 });
    const o = jest.fn().mockResolvedValue(ok('gpt-4o'));
    const svc = new LLMResilientService(
      fakeProvider('anthropic', a),
      fakeProvider('openai', o),
    );

    const seen: Array<string | undefined> = [];
    await svc.executeWithFallback(
      (cfg: ProviderConfig) => {
        seen.push(cfg.effort);
        return {
          messages: [{ role: 'user' as const, content: 'hi' }],
          maxTokens: 100,
          ...(cfg.effort ? { effort: cfg.effort } : {}),
        };
      },
      parser,
      stack,
    );

    expect(seen).toContain('high'); // primary carries effort
    expect(seen).toContain(undefined); // fallback does not
  });
});

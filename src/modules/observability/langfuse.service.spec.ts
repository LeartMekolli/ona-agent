import { OnaLangfuseService } from './langfuse.service';
import { PrivacyService } from '../privacy/privacy.service';

describe('OnaLangfuseService', () => {
  const makeClient = () => {
    const generation = jest.fn();
    const update = jest.fn();
    const trace = jest.fn().mockReturnValue({ id: 'tr_1', generation, update });
    return {
      client: { trace, flushAsync: jest.fn() } as never,
      trace,
      generation,
      update,
    };
  };

  it('opens a trace and returns a handle', () => {
    const { client, trace } = makeClient();
    const svc = new OnaLangfuseService(client, new PrivacyService());
    const run = svc.startRun({ name: 'support-run', triggerId: 'msg_1' });

    expect(trace).toHaveBeenCalledTimes(1);
    expect(run.id).toBe('tr_1');
  });

  it('records a generation with computed cost', () => {
    const { client, generation } = makeClient();
    const svc = new OnaLangfuseService(client, new PrivacyService());
    const run = svc.startRun({ name: 'r', triggerId: 't' });

    run.generation({
      name: 'turn-1',
      model: 'claude-opus-5',
      input: 'hi',
      output: 'ok',
      usage: {
        inputTokens: 1000,
        outputTokens: 100,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    });

    const arg = generation.mock.calls[0][0];
    expect(arg.model).toBe('claude-opus-5');
    expect(arg.metadata.costUsd).toBeGreaterThan(0);
  });

  it('replays failed attempts as ERROR-level generations so a silent fallback is visible', () => {
    const { client, generation } = makeClient();
    const svc = new OnaLangfuseService(client, new PrivacyService());
    const run = svc.startRun({ name: 'r', triggerId: 't' });

    run.recordFailedAttempts([
      {
        provider: 'anthropic',
        model: 'claude-opus-5',
        attemptNumber: 1,
        isFallback: false,
        errorCode: 529,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      {
        provider: 'openai',
        model: 'gpt-4o',
        attemptNumber: 1,
        isFallback: true,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    ]);

    // Only the failed attempt is replayed, at ERROR level.
    expect(generation).toHaveBeenCalledTimes(1);
    expect(generation.mock.calls[0][0].level).toBe('ERROR');
  });
});

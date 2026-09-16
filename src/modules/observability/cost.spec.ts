import { costOf } from './cost';

describe('costOf', () => {
  it('prices opus 5 input and output', () => {
    // $5/1M in, $25/1M out
    const c = costOf('claude-opus-5', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    });
    expect(c).toBeCloseTo(30, 5);
  });

  it('prices haiku 4.5', () => {
    // $1/1M in, $5/1M out
    const c = costOf('claude-haiku-4-5', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    });
    expect(c).toBeCloseTo(6, 5);
  });

  it('prices cache reads below uncached input', () => {
    const cached = costOf('claude-opus-5', {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 1_000_000,
    });
    const uncached = costOf('claude-opus-5', {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    });
    expect(cached).toBeLessThan(uncached);
  });

  it('returns 0 for an unknown model rather than throwing', () => {
    expect(
      costOf('some-unknown-model', {
        inputTokens: 100,
        outputTokens: 100,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      }),
    ).toBe(0);
  });
});

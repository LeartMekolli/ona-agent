import { AnthropicProvider } from './anthropic.provider';
import type { UnifiedLLMRequest } from '../types';

const fakeSdkResponse = {
  content: [
    { type: 'thinking', thinking: 'considering the order state' },
    { type: 'text', text: 'Your parcel is in transit.' },
    {
      type: 'tool_use',
      id: 'tu_1',
      name: 'getOrderDetails',
      input: { orderId: 'o1' },
    },
  ],
  stop_reason: 'tool_use',
  model: 'claude-opus-5',
  usage: {
    input_tokens: 100,
    output_tokens: 20,
    cache_creation_input_tokens: 5,
    cache_read_input_tokens: 50,
  },
};

describe('AnthropicProvider', () => {
  const makeClient = (create: jest.Mock) => ({ messages: { create } }) as never;
  const req: UnifiedLLMRequest = {
    messages: [{ role: 'user', content: 'where is my order' }],
    maxTokens: 4096,
    effort: 'high',
  };

  it('normalizes content blocks into a unified response', async () => {
    const create = jest.fn().mockResolvedValue(fakeSdkResponse);
    const provider = new AnthropicProvider(makeClient(create));
    const res = await provider.send(
      req,
      'claude-opus-5',
      new AbortController().signal,
    );

    expect(res.text).toBe('Your parcel is in transit.');
    expect(res.thinking).toBe('considering the order state');
    expect(res.toolCalls).toEqual([
      { id: 'tu_1', name: 'getOrderDetails', input: { orderId: 'o1' } },
    ]);
    expect(res.usage).toEqual({
      inputTokens: 100,
      outputTokens: 20,
      cacheCreationInputTokens: 5,
      cacheReadInputTokens: 50,
    });
    expect(res.stopReason).toBe('tool_use');
  });

  it('sends adaptive thinking and nests effort inside output_config', async () => {
    const create = jest.fn().mockResolvedValue(fakeSdkResponse);
    const provider = new AnthropicProvider(makeClient(create));
    await provider.send(req, 'claude-opus-5', new AbortController().signal);

    const sent = create.mock.calls[0][0];
    expect(sent.thinking).toEqual({ type: 'adaptive', display: 'summarized' });
    expect(sent.output_config).toEqual({ effort: 'high' });
    expect(sent).not.toHaveProperty('budget_tokens');
    expect(sent).not.toHaveProperty('effort');
  });

  it('never sends disabled thinking', async () => {
    const create = jest.fn().mockResolvedValue(fakeSdkResponse);
    const provider = new AnthropicProvider(makeClient(create));
    await provider.send(
      { ...req, effort: 'low' },
      'claude-opus-5',
      new AbortController().signal,
    );
    expect(create.mock.calls[0][0].thinking.type).toBe('adaptive');
  });

  it('passes the abort signal through to the SDK', async () => {
    const create = jest.fn().mockResolvedValue(fakeSdkResponse);
    const provider = new AnthropicProvider(makeClient(create));
    const ctrl = new AbortController();
    await provider.send(req, 'claude-opus-5', ctrl.signal);
    expect(create.mock.calls[0][1]).toEqual({ signal: ctrl.signal });
  });

  it('joins multiple text blocks', async () => {
    const create = jest.fn().mockResolvedValue({
      ...fakeSdkResponse,
      content: [
        { type: 'text', text: 'one' },
        { type: 'text', text: 'two' },
      ],
    });
    const provider = new AnthropicProvider(makeClient(create));
    const res = await provider.send(
      req,
      'claude-opus-5',
      new AbortController().signal,
    );
    expect(res.text).toBe('one\ntwo');
  });
});

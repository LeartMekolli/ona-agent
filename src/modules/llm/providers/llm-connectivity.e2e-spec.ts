import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAiProvider } from './openai.provider';
import type { UnifiedTool } from '../types';

const tool: UnifiedTool = {
  name: 'get_order',
  description: 'Look up an order by its id.',
  parameters: {
    type: 'object',
    properties: { orderId: { type: 'string' } },
    required: ['orderId'],
  },
};

jest.setTimeout(120_000);

describe('live connectivity', () => {
  it('anthropic: plain chat', async () => {
    const p = new AnthropicProvider(new Anthropic());
    const res = await p.send(
      {
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        maxTokens: 1024,
        effort: 'low',
      },
      'claude-opus-5',
      AbortSignal.timeout(90_000),
    );
    expect(res.text.toLowerCase()).toContain('ok');
    expect(res.usage.inputTokens).toBeGreaterThan(0);
  });

  it('anthropic: emits a tool call', async () => {
    const p = new AnthropicProvider(new Anthropic());
    const res = await p.send(
      {
        messages: [
          { role: 'user', content: 'Look up order o-123 using the tool.' },
        ],
        tools: [tool],
        maxTokens: 2048,
        effort: 'low',
      },
      'claude-opus-5',
      AbortSignal.timeout(90_000),
    );
    expect(res.toolCalls.length).toBeGreaterThan(0);
    expect(res.toolCalls[0]?.name).toBe('get_order');
  });

  it('openai: plain chat', async () => {
    const p = new OpenAiProvider(new OpenAI());
    const res = await p.send(
      {
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        maxTokens: 256,
      },
      'gpt-4o-mini',
      AbortSignal.timeout(45_000),
    );
    expect(res.text.toLowerCase()).toContain('ok');
  });
});

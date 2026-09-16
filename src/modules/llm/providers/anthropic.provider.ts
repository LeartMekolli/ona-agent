import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ProviderName } from './provider.interface';
import type {
  UnifiedLLMRequest,
  UnifiedLLMResponse,
  UnifiedToolCall,
} from '../types';
import { toAnthropicTools } from '../schema-translate';

function supportsReasoningControls(model: string): boolean {
  return model.startsWith('claude-opus');
}

export class AnthropicProvider implements LLMProvider {
  readonly name: ProviderName = 'anthropic';

  constructor(private readonly client: Anthropic) {}

  async send(
    req: UnifiedLLMRequest,
    model: string,
    signal: AbortSignal,
  ): Promise<UnifiedLLMResponse> {
    const body: Record<string, unknown> = {
      model,
      max_tokens: req.maxTokens,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    const reasoningControls = supportsReasoningControls(model);

    // Adaptive only, and only on models that support it (Opus). `budget_tokens`
    // is removed and 400s on claude-opus-5; `disabled` can cause tool calls to
    // appear as visible text. Haiku rejects `thinking` entirely with a 400.
    if (reasoningControls)
      body['thinking'] = { type: 'adaptive', display: 'summarized' };

    if (req.system !== undefined) body['system'] = req.system;
    if (req.tools && req.tools.length > 0)
      body['tools'] = toAnthropicTools(req.tools);
    // effort nests inside output_config, never at the top level, and only
    // on models that support it.
    if (req.effort !== undefined && reasoningControls)
      body['output_config'] = { effort: req.effort };

    const res = await this.client.messages.create(body as never, { signal });
    return normalizeAnthropic(res as never);
  }
}

interface AnthropicBlock {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

function normalizeAnthropic(res: {
  content: AnthropicBlock[];
  stop_reason: string;
  model: string;
  usage: Record<string, number | undefined>;
}): UnifiedLLMResponse {
  const texts: string[] = [];
  const thinkings: string[] = [];
  const toolCalls: UnifiedToolCall[] = [];

  for (const block of res.content) {
    if (block.type === 'text' && block.text !== undefined)
      texts.push(block.text);
    else if (block.type === 'thinking' && block.thinking !== undefined)
      thinkings.push(block.thinking);
    else if (block.type === 'tool_use' && block.id && block.name) {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input ?? {},
      });
    }
  }

  const thinking = thinkings.join('\n');
  return {
    text: texts.join('\n'),
    ...(thinking.length > 0 ? { thinking } : {}),
    toolCalls,
    usage: {
      inputTokens: res.usage['input_tokens'] ?? 0,
      outputTokens: res.usage['output_tokens'] ?? 0,
      cacheCreationInputTokens: res.usage['cache_creation_input_tokens'] ?? 0,
      cacheReadInputTokens: res.usage['cache_read_input_tokens'] ?? 0,
    },
    stopReason: res.stop_reason,
    model: res.model,
  };
}

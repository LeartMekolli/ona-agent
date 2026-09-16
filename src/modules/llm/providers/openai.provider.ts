import OpenAI from 'openai';
import type { LLMProvider, ProviderName } from './provider.interface';
import type {
  UnifiedLLMRequest,
  UnifiedLLMResponse,
  UnifiedToolCall,
} from '../types';
import { toOpenAiTools } from '../schema-translate';

export class OpenAiProvider implements LLMProvider {
  readonly name: ProviderName = 'openai';

  constructor(private readonly client: OpenAI) {}

  async send(
    req: UnifiedLLMRequest,
    model: string,
    signal: AbortSignal,
  ): Promise<UnifiedLLMResponse> {
    const messages: Array<Record<string, unknown>> = [];
    if (req.system !== undefined)
      messages.push({ role: 'system', content: req.system });
    for (const m of req.messages)
      messages.push({ role: m.role, content: m.content });

    const body: Record<string, unknown> = {
      model,
      messages,
      max_completion_tokens: req.maxTokens,
    };
    if (req.tools && req.tools.length > 0)
      body['tools'] = toOpenAiTools(req.tools);

    const res = await this.client.chat.completions.create(body as never, {
      signal,
    });
    return normalizeOpenAi(res as never);
  }
}

function normalizeOpenAi(res: {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}): UnifiedLLMResponse {
  const choice = res.choices[0];
  if (choice === undefined) {
    return {
      text: '',
      toolCalls: [],
      stopReason: 'empty',
      model: res.model,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      },
    };
  }

  const toolCalls: UnifiedToolCall[] = (choice.message.tool_calls ?? []).map(
    (tc) => ({
      id: tc.id,
      name: tc.function.name,
      // Always parse; never string-match serialized tool input.
      input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }),
  );

  return {
    text: choice.message.content ?? '',
    toolCalls,
    usage: {
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens:
        res.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    },
    stopReason: choice.finish_reason,
    model: res.model,
  };
}

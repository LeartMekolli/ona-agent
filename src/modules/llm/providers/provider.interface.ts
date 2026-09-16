import type { UnifiedLLMRequest, UnifiedLLMResponse } from '../types';

export type ProviderName = 'anthropic' | 'openai';

export interface LLMProvider {
  readonly name: ProviderName;
  send(
    req: UnifiedLLMRequest,
    model: string,
    signal: AbortSignal,
  ): Promise<UnifiedLLMResponse>;
}

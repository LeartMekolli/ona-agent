export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [k: string]: unknown;
}

export interface UnifiedTool {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}

export interface UnifiedToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface UnifiedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UnifiedUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export interface UnifiedLLMRequest {
  messages: readonly UnifiedMessage[];
  system?: string;
  tools?: readonly UnifiedTool[];
  maxTokens: number;
  effort?: Effort;
  jsonSchema?: JsonSchemaObject;
}

export interface UnifiedLLMResponse {
  text: string;
  thinking?: string;
  toolCalls: readonly UnifiedToolCall[];
  usage: UnifiedUsage;
  stopReason: string;
  model: string;
}

import type { JsonSchemaObject, UnifiedTool } from './types';

export interface AnthropicToolShape {
  name: string;
  description: string;
  input_schema: JsonSchemaObject;
}

export interface OpenAiToolShape {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchemaObject;
    strict?: boolean;
  };
}

/**
 * Sorted by name. Anthropic prompt caching is a prefix match over the rendered
 * request, so a map-iteration-order change in the tool list would silently
 * invalidate the cache on every call.
 */
export function toAnthropicTools(
  tools: readonly UnifiedTool[],
): AnthropicToolShape[] {
  return [...tools]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
}

export function toOpenAiTools(
  tools: readonly UnifiedTool[],
): OpenAiToolShape[] {
  return [...tools]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: toOpenAiStrictSchema(t.parameters),
        strict: true,
      },
    }));
}

function isSchemaObject(v: unknown): v is JsonSchemaObject {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { type?: unknown }).type === 'object'
  );
}

/**
 * OpenAI strict mode: every property must appear in `required`, optional
 * properties become nullable unions, and additionalProperties must be false —
 * recursively.
 */
export function toOpenAiStrictSchema(
  schema: JsonSchemaObject,
): JsonSchemaObject {
  const originallyRequired = new Set(schema.required ?? []);
  const properties: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(schema.properties)) {
    const value = isSchemaObject(rawValue)
      ? toOpenAiStrictSchema(rawValue)
      : rawValue;

    if (originallyRequired.has(key)) {
      properties[key] = value;
      continue;
    }

    if (isSchemaObject(value)) {
      properties[key] = value;
    } else if (typeof value === 'object' && value !== null && 'type' in value) {
      const t = (value as { type: unknown }).type;
      properties[key] = {
        ...(value as Record<string, unknown>),
        type: Array.isArray(t) ? [...t, 'null'] : [t, 'null'],
      };
    } else {
      properties[key] = value;
    }
  }

  return {
    ...schema,
    properties,
    required: Object.keys(schema.properties),
    additionalProperties: false,
  };
}

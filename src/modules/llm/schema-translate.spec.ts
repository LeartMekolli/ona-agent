import {
  toAnthropicTools,
  toOpenAiTools,
  toOpenAiStrictSchema,
} from './schema-translate';
import type { UnifiedTool, JsonSchemaObject } from './types';

const tool: UnifiedTool = {
  name: 'getOrderDetails',
  description: 'Fetch an order by id.',
  parameters: {
    type: 'object',
    properties: {
      orderId: { type: 'string' },
      includeItems: { type: 'boolean' },
    },
    required: ['orderId'],
  },
};

describe('toAnthropicTools', () => {
  it('maps parameters to input_schema', () => {
    const [out] = toAnthropicTools([tool]);
    expect(out).toEqual({
      name: 'getOrderDetails',
      description: 'Fetch an order by id.',
      input_schema: tool.parameters,
    });
  });

  it('sorts tools by name for prompt-cache stability', () => {
    const b: UnifiedTool = { ...tool, name: 'bTool' };
    const a: UnifiedTool = { ...tool, name: 'aTool' };
    expect(toAnthropicTools([b, a]).map((t) => t.name)).toEqual([
      'aTool',
      'bTool',
    ]);
  });
});

describe('toOpenAiTools', () => {
  it('nests under function', () => {
    const [out] = toOpenAiTools([tool]);
    expect(out).toBeDefined();
    expect(out?.type).toBe('function');
    expect(out?.function.name).toBe('getOrderDetails');
  });
});

describe('toOpenAiStrictSchema', () => {
  it('makes every property required and nullable-unions the optional ones', () => {
    const out = toOpenAiStrictSchema(tool.parameters);
    expect(out.required).toEqual(['orderId', 'includeItems']);
    expect(out.properties['includeItems']).toEqual({
      type: ['boolean', 'null'],
    });
    expect(out.properties['orderId']).toEqual({ type: 'string' });
    expect(out.additionalProperties).toBe(false);
  });

  it('recurses into nested objects', () => {
    const nested: JsonSchemaObject = {
      type: 'object',
      properties: {
        outer: {
          type: 'object',
          properties: { inner: { type: 'string' } },
          required: [],
        },
      },
      required: ['outer'],
    };
    const out = toOpenAiStrictSchema(nested);
    const outer = out.properties['outer'] as JsonSchemaObject;
    expect(outer.additionalProperties).toBe(false);
    expect(outer.required).toEqual(['inner']);
    expect(outer.properties['inner']).toEqual({ type: ['string', 'null'] });
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(tool.parameters);
    toOpenAiStrictSchema(tool.parameters);
    expect(JSON.stringify(tool.parameters)).toBe(before);
  });
});

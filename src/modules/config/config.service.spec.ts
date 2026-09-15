import { loadConfig } from './config.schema';
import { ConfigurationError } from '@/shared/errors';

const valid = {
  ANTHROPIC_API_KEY: 'sk-ant-x',
  OPENAI_API_KEY: 'sk-x',
  LANGFUSE_PUBLIC_KEY: 'pk-x',
  LANGFUSE_SECRET_KEY: 'sk-x',
  LANGFUSE_HOST: 'https://cloud.langfuse.com',
  LANGFUSE_PROMPT_LABEL: 'production',
  PINECONE_API_KEY: 'pc-x',
  PINECONE_INDEX: 'ona',
  DATABASE_URL: 'file:./ona.db',
};

describe('loadConfig', () => {
  it('parses a complete environment', () => {
    const cfg = loadConfig(valid);
    expect(cfg.anthropicApiKey).toBe('sk-ant-x');
    expect(cfg.langfuse.promptLabel).toBe('production');
  });

  it('throws ConfigurationError naming the missing variable', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PINECONE_API_KEY, ...incomplete } = valid;
    expect(() => loadConfig(incomplete)).toThrow(ConfigurationError);
    expect(() => loadConfig(incomplete)).toThrow(/PINECONE_API_KEY/);
  });

  it('rejects an empty string as missing', () => {
    expect(() => loadConfig({ ...valid, ANTHROPIC_API_KEY: '' })).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it('rejects a non-URL Langfuse host', () => {
    expect(() => loadConfig({ ...valid, LANGFUSE_HOST: 'not-a-url' })).toThrow(
      /LANGFUSE_HOST/,
    );
  });
});

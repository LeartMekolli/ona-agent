import { z } from 'zod';
import { ConfigurationError } from '@/shared/errors';

const required = (name: string) =>
  z.string().min(1, `${name} is required but was empty or missing`);

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  LANGFUSE_PUBLIC_KEY: required('LANGFUSE_PUBLIC_KEY'),
  LANGFUSE_SECRET_KEY: required('LANGFUSE_SECRET_KEY'),
  LANGFUSE_HOST: z.string().url('LANGFUSE_HOST must be a valid URL'),
  LANGFUSE_PROMPT_LABEL: required('LANGFUSE_PROMPT_LABEL'),
  PINECONE_API_KEY: required('PINECONE_API_KEY'),
  PINECONE_INDEX: required('PINECONE_INDEX'),
  DATABASE_URL: required('DATABASE_URL'),
});

export interface OnaConfig {
  readonly anthropicApiKey: string;
  readonly openaiApiKey: string;
  readonly langfuse: {
    readonly publicKey: string;
    readonly secretKey: string;
    readonly host: string;
    readonly promptLabel: string;
  };
  readonly pinecone: { readonly apiKey: string; readonly index: string };
  readonly databaseUrl: string;
}

export function loadConfig(env: Record<string, string | undefined>): OnaConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new ConfigurationError(
      `Invalid environment configuration — ${detail}`,
    );
  }
  const e = parsed.data;
  return {
    anthropicApiKey: e.ANTHROPIC_API_KEY,
    openaiApiKey: e.OPENAI_API_KEY,
    langfuse: {
      publicKey: e.LANGFUSE_PUBLIC_KEY,
      secretKey: e.LANGFUSE_SECRET_KEY,
      host: e.LANGFUSE_HOST,
      promptLabel: e.LANGFUSE_PROMPT_LABEL,
    },
    pinecone: { apiKey: e.PINECONE_API_KEY, index: e.PINECONE_INDEX },
    databaseUrl: e.DATABASE_URL,
  };
}

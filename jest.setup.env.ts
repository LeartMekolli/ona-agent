// Dummy env vars so OnaConfigService's eager, boot-time validation passes
// when AppModule is compiled in tests (e.g. app.module.spec.ts). Real API
// calls are never made under `npm test`; only *.e2e-spec.ts hits live APIs,
// and that suite is excluded from this config.
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-test';
process.env.OPENAI_API_KEY ??= 'sk-test';
process.env.LANGFUSE_PUBLIC_KEY ??= 'pk-test';
process.env.LANGFUSE_SECRET_KEY ??= 'sk-test';
process.env.LANGFUSE_HOST ??= 'https://cloud.langfuse.com';
process.env.LANGFUSE_PROMPT_LABEL ??= 'test';
process.env.PINECONE_API_KEY ??= 'pc-test';
process.env.PINECONE_INDEX ??= 'ona-test';
process.env.DATABASE_URL ??= 'file:./test.db';

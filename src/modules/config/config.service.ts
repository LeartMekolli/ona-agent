import { Injectable } from '@nestjs/common';
import { loadConfig, type OnaConfig } from './config.schema';

@Injectable()
export class OnaConfigService {
  private readonly config: OnaConfig = loadConfig(process.env);

  get anthropicApiKey(): string {
    return this.config.anthropicApiKey;
  }

  get openaiApiKey(): string {
    return this.config.openaiApiKey;
  }

  get langfuse(): OnaConfig['langfuse'] {
    return this.config.langfuse;
  }

  get pinecone(): OnaConfig['pinecone'] {
    return this.config.pinecone;
  }

  get databaseUrl(): string {
    return this.config.databaseUrl;
  }
}

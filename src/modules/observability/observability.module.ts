import { Global, Module } from '@nestjs/common';
import { Langfuse } from 'langfuse';
import { OnaConfigService } from '../config/config.service';
import { PrivacyService } from '../privacy/privacy.service';
import { OnaLangfuseService } from './langfuse.service';

export const LANGFUSE_CLIENT = Symbol('LANGFUSE_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: LANGFUSE_CLIENT,
      useFactory: (c: OnaConfigService, p: PrivacyService) =>
        new Langfuse({
          publicKey: c.langfuse.publicKey,
          secretKey: c.langfuse.secretKey,
          baseUrl: c.langfuse.host,
          // Second net behind explicit pseudonymization (spec §3.2).
          mask: ({ data }: { data: unknown }) => p.sanitizeForTrace(data),
        }),
      inject: [OnaConfigService, PrivacyService],
    },
    {
      provide: OnaLangfuseService,
      useFactory: (client: Langfuse, p: PrivacyService) =>
        new OnaLangfuseService(client, p),
      inject: [LANGFUSE_CLIENT, PrivacyService],
    },
  ],
  exports: [OnaLangfuseService, LANGFUSE_CLIENT],
})
export class ObservabilityModule {}

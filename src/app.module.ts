import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OnaConfigModule } from './modules/config/config.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { LLMModule } from './modules/llm/llm.module';

@Module({
  imports: [OnaConfigModule, PrivacyModule, ObservabilityModule, LLMModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

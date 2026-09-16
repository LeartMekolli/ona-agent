import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { OnaConfigModule } from '../config/config.module';
import { OnaConfigService } from '../config/config.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { LLMResilientService } from './resilience/llm-resilient.service';

export const ANTHROPIC_PROVIDER = Symbol('ANTHROPIC_PROVIDER');
export const OPENAI_PROVIDER = Symbol('OPENAI_PROVIDER');

@Module({
  imports: [OnaConfigModule],
  providers: [
    {
      provide: ANTHROPIC_PROVIDER,
      useFactory: (c: OnaConfigService) =>
        new AnthropicProvider(new Anthropic({ apiKey: c.anthropicApiKey })),
      inject: [OnaConfigService],
    },
    {
      provide: OPENAI_PROVIDER,
      useFactory: (c: OnaConfigService) =>
        new OpenAiProvider(new OpenAI({ apiKey: c.openaiApiKey })),
      inject: [OnaConfigService],
    },
    {
      provide: LLMResilientService,
      useFactory: (a: AnthropicProvider, o: OpenAiProvider) =>
        new LLMResilientService(a, o),
      inject: [ANTHROPIC_PROVIDER, OPENAI_PROVIDER],
    },
  ],
  exports: [LLMResilientService, ANTHROPIC_PROVIDER, OPENAI_PROVIDER],
})
export class LLMModule {}

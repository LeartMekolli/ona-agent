import { Global, Module } from '@nestjs/common';
import { OnaConfigService } from './config.service';

@Global()
@Module({ providers: [OnaConfigService], exports: [OnaConfigService] })
export class OnaConfigModule {}

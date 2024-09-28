import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { HttpModule } from '@nestjs/axios';
import { ApiConfigService } from './services/api-config.service';
import { AwsS3Service } from './services/aws-s3.service';
import { EmailService } from './services/email.service';
import { GeneratorService } from './services/generator.service';
import { GroqService } from './services/groq.service';
import { PrismaService } from './services/prisma.service';
import { UnsplashService } from './services/unsplash.service';
import { ValidatorService } from './services/validator.service';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  PrismaService,
  EmailService,
  GroqService,

  UnsplashService,
];

@Global()
@Module({
  providers,
  imports: [CqrsModule, HttpModule],
  exports: [...providers, CqrsModule],
})
export class SharedModule {}

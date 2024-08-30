import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false),
      );
    }
  }
}

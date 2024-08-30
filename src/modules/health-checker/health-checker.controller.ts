import { Controller, Get } from '@nestjs/common';
import type { HealthCheckResult } from '@nestjs/terminus';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { PrismaHealthIndicator } from './health-indicators/prisma.indicator'; // Add this import
import { ServiceHealthIndicator } from './health-indicators/service.indicator';

@Controller('health')
export class HealthCheckerController {
  constructor(
    private healthCheckService: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator, // Replace ormIndicator with prismaIndicator
    private serviceIndicator: ServiceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.prismaIndicator.isHealthy('database'), // Replace ormIndicator with prismaIndicator
      () => this.serviceIndicator.isHealthy('search-service-health'),
    ]);
  }
}

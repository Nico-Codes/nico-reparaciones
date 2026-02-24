import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      ok: true,
      service: 'nico-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  getLiveness() {
    return {
      ok: true,
      status: 'live',
      service: 'nico-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        status: 'ready',
        service: 'nico-api',
        checks: {
          db: 'ok',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        ok: false,
        status: 'not_ready',
        service: 'nico-api',
        checks: {
          db: 'error',
        },
        message: error instanceof Error ? error.message : 'DB check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('info')
  getInfo() {
    return {
      ok: true,
      status: 'info',
      service: 'nico-api',
      env: (process.env.NODE_ENV ?? 'development').toLowerCase(),
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? '0.0.0',
      commit: process.env.GIT_SHA ?? null,
      startedAt: new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

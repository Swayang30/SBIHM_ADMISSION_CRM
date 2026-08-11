import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (e) {
      console.warn("Could not connect to database, starting NestJS server in fallback mode.");
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

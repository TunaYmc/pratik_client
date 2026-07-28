import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super(); // Let v7 pick up from prisma.config.ts
    }

    async onModuleInit() {
        await this.$connect();
    }
}

import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app/app.module';
import { testKit } from '../utils/test-kit.util';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { RedisService } from 'src/redis/redis.service';

let nestApp: INestApplication<App>;

beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    nestApp = moduleFixture.createNestApplication();
    testKit.app = nestApp;
    await nestApp.init();
});

afterAll(async () => {
    if (nestApp) {
        const dataSource = nestApp.get<DataSource>(getDataSourceToken());
        const redisService = nestApp.get<RedisService>(RedisService);
        await dataSource.dropDatabase();
        await dataSource.destroy();
        redisService.disconnect();
        await nestApp.close();
    }
});

import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

export interface ITestKit {
    app: INestApplication<App>;
}

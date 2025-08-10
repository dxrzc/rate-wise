import { AppModule } from 'src/app/app.module';
import { Test, TestingModule } from '@nestjs/testing';

beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
});

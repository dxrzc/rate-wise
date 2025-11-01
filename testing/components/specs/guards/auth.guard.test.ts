import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { createTypeormImport } from '@components/imports/create-typeorm.import';
import { createLightWeightPostgres } from '@components/utils/create-lightweight-postgres.util';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { appAuthGuard } from 'src/app/providers/guards/app-auth.guard.provider';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { UsersModule } from 'src/users/users.module';
import * as request from 'supertest';

@Resolver()
export class DummyResolver {
    @Query(() => Boolean, { name: 'testQuery' })
    testQuery(): boolean {
        return true;
    }

    @Mutation(() => Boolean, { name: 'testMutation' })
    testMutation(): boolean {
        return true;
    }
}

const testOperation = `
query MyQuery {
    testQuery
}`;

describe('AuthGuard', () => {
    let testingModule: TestingModule;
    let nestApp: NestExpressApplication;

    beforeAll(async () => {
        const postgresUri = await createLightWeightPostgres();
        testingModule = await Test.createTestingModule({
            imports: [
                ...createTypeormImport(postgresUri),
                ...createDisabledLoggerImport(),
                ...createGqlImport(),
                UsersModule,
            ],
            providers: [appAuthGuard, DummyResolver],
        }).compile();
        nestApp = testingModule.createNestApplication({});
        nestApp.useLogger(false);
        await nestApp.init();
    });

    afterAll(async () => {
        await testingModule.close();
    });

    describe('Session cookie not provided', () => {
        test('should return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await request(nestApp.getHttpServer())
                .post('/graphql')
                .send({ query: testOperation });
            expect(res).toFailWith(
                Code.UNAUTHORIZED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });
});

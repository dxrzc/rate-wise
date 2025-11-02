import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { createTypeormImport } from '@components/imports/create-typeorm.import';
import { createUser } from '@components/utils/create-user.util';
import { Controller, Get, Req } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { seconds } from '@nestjs/throttler';
import * as session from 'express-session';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RequestContext } from 'src/auth/types/request-context.type';
import { Code } from 'src/common/enum/code.enum';
import { SeedModule } from 'src/seed/seed.module';
import { UsersModule } from 'src/users/users.module';
import * as request from 'supertest';
import { Query as RestQuery } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { deleteUser } from '@components/utils/delete-user.util';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { readPostgresUrl } from '@components/utils/read-postgres-uri';

// Test AuthGuard isolated and how it behaves with REST and GQL contexts.

@Resolver()
export class TestResolver {
    @Query(() => Boolean, { name: 'testQuery' })
    testQuery(): boolean {
        return true;
    }

    @Mutation(() => Boolean, { name: 'testMutation' })
    testMutation(): boolean {
        return true;
    }
}

@Controller('test')
export class TestController {
    // Generates a valid session cookie
    @Public()
    @Get()
    createCookie(
        @Req() req: RequestContext,
        @RestQuery('userId') userId: string,
    ) {
        req.session.userId = userId;
    }
}

const testOperation = `
query MyQuery {
    testQuery
}`;

describe('AuthGuard', () => {
    let testingModule: TestingModule;
    let app: NestExpressApplication;
    const sessCookieName = 'sess';

    beforeAll(async () => {
        const postgresUrl = await readPostgresUrl();
        testingModule = await Test.createTestingModule({
            imports: [
                ...createTypeormImport(postgresUrl),
                ...createDisabledLoggerImport(),
                ...createGqlImport(),
                SeedModule,
                UsersModule,
            ],
            providers: [
                { provide: APP_GUARD, useClass: AuthGuard },
                TestResolver,
            ],
            controllers: [TestController],
        }).compile();
        app = testingModule.createNestApplication({});
        app.useLogger(false);
        app.use(
            // in-memory
            session({
                saveUninitialized: false,
                name: sessCookieName,
                unset: 'destroy',
                resave: false,
                secret: '123',
                rolling: true,
                cookie: {
                    maxAge: seconds(1),
                    httpOnly: true,
                    secure: false,
                },
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await testingModule.close();
    });

    async function getSessionCookie(id: string) {
        const res = await request(app.getHttpServer()).get(
            `/test?userId=${id}`,
        );
        const cookie = res.headers['set-cookie'][0];
        return cookie;
    }

    describe('Session cookie provided', () => {
        test('guard allows access successfully', async () => {
            const { id } = await createUser(app);
            const cookie = await getSessionCookie(id);
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', cookie)
                .send({ query: testOperation });
            expect(res).notToFail();
        });
    });

    describe('Session cookie not provided', () => {
        test('should return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: testOperation });
            expect(res).toFailWith(
                Code.UNAUTHORIZED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('User in cookie not found', () => {
        test('should return NOT FOUND code and USER NOT FOUND message ', async () => {
            const { id } = await createUser(app);
            const cookie = await getSessionCookie(id);
            await deleteUser(app, id);
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', cookie)
                .send({ query: testOperation });
            expect(res).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });
});

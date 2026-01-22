import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { Controller, Get, Req } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { seconds } from '@nestjs/throttler';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RequestContext } from 'src/auth/types/request-context.type';
import { Code } from 'src/common/enum/code.enum';
import request from 'supertest';
import { Query as RestQuery } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UsersService } from 'src/users/users.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { createLightweightRedisContainer } from '@components/utils/create-lightweight-redis.util';
import { SessionMiddlewareFactory } from 'src/sessions/middlewares/session.middleware.factory';
import { SessionsService } from 'src/sessions/sessions.service';

// Used to test the guard
@Resolver()
export class TestResolver {
    @Query(() => Boolean, { name: 'testQuery' })
    testQuery(): boolean {
        return true;
    }
}
const testOperation = `
query MyQuery {
    testQuery
}`;

// Used to generate a valid session cookie
@Controller('session')
export class SessionGeneratorController {
    constructor(private readonly sessionService: SessionsService) {}

    @Public()
    @Get()
    async createCookie(@Req() req: RequestContext, @RestQuery('userId') userId: string) {
        await this.sessionService.create(req, userId);
    }
}

describe('AuthGuard', () => {
    let testingModule: TestingModule;
    let userFound: any = {};
    const usersService = { findOneById: () => userFound };
    let app: NestExpressApplication;

    beforeAll(async () => {
        const redisUrl = await createLightweightRedisContainer();
        testingModule = await Test.createTestingModule({
            imports: [
                ...createDisabledLoggerImport(),
                ...createGqlImport(),
                SessionsModule.forRootAsync({
                    useFactory: () => ({
                        connection: { redisUri: redisUrl },
                        cookieMaxAgeMs: seconds(3),
                        cookieName: 'sess',
                        cookieSecret: '123',
                        secure: false,
                    }),
                }),
            ],
            providers: [{ provide: APP_GUARD, useClass: AuthGuard }, TestResolver, UsersService],
            controllers: [SessionGeneratorController],
        })
            .overrideProvider(UsersService)
            .useValue(usersService)
            .compile();
        app = testingModule.createNestApplication({});
        app.useLogger(false);
        app.use(app.get(SessionMiddlewareFactory).create());
        await app.init();
    });

    afterAll(async () => {
        await testingModule.close();
    });

    async function getSessionCookie(id: string) {
        const res = await request(app.getHttpServer()).get(`/session?userId=${id}`);
        const cookie = res.headers['set-cookie'][0];
        return cookie;
    }

    describe('Valid session cookie and user exists', () => {
        test('guard allows access successfully', async () => {
            // mock existing user
            userFound = { user: 'test' };
            const cookie = await getSessionCookie('test-id');
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', cookie)
                .send({ query: testOperation });
            expect(res).notToFail();
        });
    });

    describe('Session cookie not provided', () => {
        describe('User exists', () => {
            test('return unauthorized code and unauthorized error message', async () => {
                // mock existing user
                userFound = { user: 'test' };
                const res = await request(app.getHttpServer())
                    .post('/graphql') // sess cookie not set
                    .send({ query: testOperation });
                expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
            });
        });
    });

    describe('User in cookie not found', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            // mock non-existing user
            userFound = null;
            const cookie = await getSessionCookie('test-id');
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', cookie)
                .send({ query: testOperation });
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });
});

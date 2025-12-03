import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { Controller, Get, Req } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { seconds } from '@nestjs/throttler';
import session from 'express-session';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RequestContext } from 'src/auth/types/request-context.type';
import { Code } from 'src/common/enum/code.enum';
import request from 'supertest';
import { Query as RestQuery } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UsersService } from 'src/users/users.service';

// Test AuthGuard in isolation

@Resolver()
export class TestResolver {
    @Query(() => Boolean, { name: 'testQuery' })
    testQuery(): boolean {
        return true;
    }
}

@Controller('test')
export class TestController {
    // Generates a valid session cookie
    @Public()
    @Get()
    createCookie(@Req() req: RequestContext, @RestQuery('userId') userId: string) {
        req.session.userId = userId;
    }
}

const testOperation = `
query MyQuery {
    testQuery
}`;

describe('AuthGuard', () => {
    let testingModule: TestingModule;
    let userFound: any = {};
    const usersService = { findOneById: () => userFound };

    let app: NestExpressApplication;
    const sessCookieName = 'sess';

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [...createDisabledLoggerImport(), ...createGqlImport()],
            providers: [{ provide: APP_GUARD, useClass: AuthGuard }, TestResolver, UsersService],
            controllers: [TestController],
        })
            .overrideProvider(UsersService)
            .useValue(usersService)
            .compile();
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
        const res = await request(app.getHttpServer()).get(`/test?userId=${id}`);
        const cookie = res.headers['set-cookie'][0];
        return cookie;
    }

    describe('Session cookie provided', () => {
        describe('User exists', () => {
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

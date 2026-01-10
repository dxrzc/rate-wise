import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { generateGqlQuery } from '@components/utils/generate-test-gql-query.util';
import { APP_GUARD } from '@nestjs/core';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatusGuard } from 'src/auth/guards/account-status.guard';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import {
    ALL_ACCOUNT_STATUSES,
    RequireAccountStatus,
} from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { Code } from 'src/common/enum/code.enum';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import request from 'supertest';

@Resolver()
export class TestResolver {
    @Query(() => Boolean)
    noDecorator(): boolean {
        return true;
    }

    @Public()
    @Query(() => Boolean)
    public(): boolean {
        return true;
    }

    @RequireAccountStatus(AccountStatus.ACTIVE)
    @Query(() => Boolean)
    activeOnly(): boolean {
        return true;
    }

    @RequireAccountStatus(AccountStatus.PENDING_VERIFICATION, AccountStatus.ACTIVE)
    @Query(() => Boolean)
    pendingVerOrActive(): boolean {
        return true;
    }

    @RequireAccountStatus(ALL_ACCOUNT_STATUSES)
    @Query(() => Boolean)
    allAllowed(): boolean {
        return true;
    }
}

describe('AccountStatus Guard', () => {
    let testingModule: TestingModule;
    let app: NestExpressApplication;
    let mockReqData: { user: Partial<AuthenticatedUser> };
    const resolver = TestResolver.prototype;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                ...createDisabledLoggerImport(),
                ...createGqlImport(() => mockReqData), // Allow customize req.user in every test
            ],
            providers: [{ provide: APP_GUARD, useClass: AccountStatusGuard }, TestResolver],
        }).compile();
        app = testingModule.createNestApplication({});
        app.useLogger(false);
        await app.init();
    });

    beforeEach(() => {
        mockReqData = {
            user: {
                status: AccountStatus.PENDING_VERIFICATION,
                email: 'user@gmail.com',
                username: 'TestUser',
                roles: [UserRole.REVIEWER, UserRole.CREATOR],
                id: '12345',
            },
        };
    });

    describe('No decorator provided in Graphql operation', () => {
        test('return internal server error code and error message', async () => {
            const query = generateGqlQuery(resolver.noDecorator.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).toFailWith(
                Code.INTERNAL_SERVER_ERROR,
                COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
            );
        });
    });

    describe('Graphql operation has the @Public decorator', () => {
        test('guard grant access', async () => {
            const query = generateGqlQuery(resolver.public.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).notToFail();
        });
    });

    describe('Account status required is "ACTIVE"', () => {
        describe('User account status is "PENDING_VERIFICATION"', () => {
            test('return forbidden code and account is not active error message', async () => {
                const query = generateGqlQuery(resolver.activeOnly.name);
                mockReqData.user.status = AccountStatus.PENDING_VERIFICATION;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
            });
        });
    });

    describe('Account status required is "PENDING_VERIFICATION" or "ACTIVE"', () => {
        describe('User account status is "SUSPENDED"', () => {
            test('return forbidden code and account is suspended error message', async () => {
                const query = generateGqlQuery(resolver.pendingVerOrActive.name);
                mockReqData.user.status = AccountStatus.SUSPENDED;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
            });
        });
    });

    describe('Graphql operation contains ALL_ACCOUNT_STATUSES', () => {
        describe('User account status is "SUSPENDED"', () => {
            test('guard grant access', async () => {
                const query = generateGqlQuery(resolver.allAllowed.name);
                mockReqData.user.status = AccountStatus.SUSPENDED;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).notToFail();
            });
        });
    });
});

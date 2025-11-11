import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { generateGqlQuery } from '@components/utils/generate-test-gql-query.util';
import { APP_GUARD } from '@nestjs/core';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatusGuard } from 'src/auth/guards/account-status.guard';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { AllAccountStatusesAllowed } from 'src/common/decorators/all-account-statuses-allowed.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
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

    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Query(() => Boolean)
    activeOnly(): boolean {
        return true;
    }

    @MinAccountStatusRequired(AccountStatus.PENDING_VERIFICATION)
    @Query(() => Boolean)
    pendingVerOnly(): boolean {
        return true;
    }

    @AllAccountStatusesAllowed()
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
                roles: [UserRole.USER],
                id: '12345',
            },
        };
    });

    describe('No decorator provided in Graphql operation', () => {
        test('should return INTERNAL SERVER code and message', async () => {
            const query = generateGqlQuery(resolver.noDecorator.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).toFailWith(
                Code.INTERNAL_SERVER_ERROR,
                COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
            );
        });
    });

    describe('Graphql operation has the @Public decorator', () => {
        test('guard should grant access', async () => {
            const query = generateGqlQuery(resolver.public.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).notToFail();
        });
    });

    describe('Account status required is "ACTIVE"', () => {
        describe('User account status is "PENDING_VERIFICATION"', () => {
            test('return FORBIDDEN code and ACCOUNT_IS_NOT_ACTIVE message', async () => {
                const query = generateGqlQuery(resolver.activeOnly.name);
                mockReqData.user.status = AccountStatus.PENDING_VERIFICATION;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
            });
        });
    });

    describe('Account status required is "PENDING_VERIFICATION"', () => {
        describe('User account status is "SUSPENDED"', () => {
            test('return FORBIDDEN code and ACCOUNT_IS_SUSPENDED message', async () => {
                const query = generateGqlQuery(resolver.pendingVerOnly.name);
                mockReqData.user.status = AccountStatus.SUSPENDED;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
            });
        });
    });

    describe('Graphql operation contains the @AllStatusesAllowed decorator', () => {
        describe('User account status is "SUSPENDED"', () => {
            test('guard should grant access', async () => {
                const query = generateGqlQuery(resolver.allAllowed.name);
                mockReqData.user.status = AccountStatus.SUSPENDED;
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).notToFail();
            });
        });
    });
});

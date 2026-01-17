import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { generateGqlQuery } from '@components/utils/generate-test-gql-query.util';
import { APP_GUARD } from '@nestjs/core';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { Writable } from '@testing/tools/types/writable.type';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Public } from 'src/common/decorators/public.decorator';
import { ALL_ROLES, Roles } from 'src/common/decorators/roles.decorator';
import { Code } from 'src/common/enum/code.enum';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import request from 'supertest';

@Resolver()
export class TestResolver {
    @Query(() => Boolean)
    noRoleGuardApplied(): boolean {
        return true;
    }

    @Roles(UserRole.ADMIN)
    @Query(() => Boolean)
    adminRoleApplied(): boolean {
        return true;
    }

    @Roles(UserRole.REVIEWER)
    @Query(() => Boolean)
    userRoleApplied(): boolean {
        return true;
    }

    @Roles(UserRole.REVIEWER, UserRole.ADMIN)
    @Query(() => Boolean)
    userAndminRolesApplied(): boolean {
        return true;
    }

    @Public()
    @Query(() => Boolean)
    publicOperation(): boolean {
        return true;
    }

    @Roles(...ALL_ROLES)
    @Query(() => Boolean)
    allRoles(): boolean {
        return true;
    }
}

describe('Roles Guard', () => {
    let testingModule: TestingModule;
    let app: NestExpressApplication;
    let mockReqData: { user: Partial<Writable<AuthenticatedUser>> };
    const resolver = TestResolver.prototype;

    beforeEach(() => {
        mockReqData = {
            user: {
                status: AccountStatus.PENDING_VERIFICATION,
                email: 'user@gmail.com',
                username: 'TestUser',
                roles: [UserRole.REVIEWER],
                id: '12345',
            },
        };
    });

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [...createDisabledLoggerImport(), ...createGqlImport(() => mockReqData)],
            providers: [{ provide: APP_GUARD, useClass: RolesGuard }, TestResolver],
        }).compile();
        app = testingModule.createNestApplication({});
        app.useLogger(false);
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('No role guard was applied', () => {
        test('return internal server error code and internal server error error message', async () => {
            const query = generateGqlQuery(resolver.noRoleGuardApplied.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).toFailWith(
                Code.INTERNAL_SERVER_ERROR,
                COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
            );
        });
    });

    describe('Operation has the @Public decorator', () => {
        test('roles guard grant access', async () => {
            const query = generateGqlQuery(resolver.publicOperation.name);
            const res = await request(app.getHttpServer()).post('/graphql').send({ query });
            expect(res).notToFail();
        });
    });

    describe('Operation has the admin role applied', () => {
        describe('User does not have admin role in their roles', () => {
            test('return forbidden code and forbidden error message', async () => {
                mockReqData.user.roles = [UserRole.REVIEWER, UserRole.MODERATOR];
                const query = generateGqlQuery(resolver.adminRoleApplied.name);
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        });
    });

    describe('Operation has only the user role applied', () => {
        describe('User has only the administrator role', () => {
            test('return forbidden code and forbidden error message', async () => {
                mockReqData.user.roles = [UserRole.ADMIN];
                const query = generateGqlQuery(resolver.userRoleApplied.name);
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        });
    });

    describe('Operation has the user and admin role applied', () => {
        describe('User has the user role', () => {
            test('guard grant access', async () => {
                mockReqData.user.roles = [UserRole.REVIEWER];
                const query = generateGqlQuery(resolver.userAndminRolesApplied.name);
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).notToFail();
            });
        });
    });

    describe('Operation has the ALL_ROLES applied', () => {
        describe('User has all the roles', () => {
            test('guard grant access', async () => {
                mockReqData.user.roles = [UserRole.ADMIN, UserRole.REVIEWER, UserRole.MODERATOR];
                const query = generateGqlQuery(resolver.allRoles.name);
                const res = await request(app.getHttpServer()).post('/graphql').send({ query });
                expect(res).notToFail();
            });
        });
    });
});

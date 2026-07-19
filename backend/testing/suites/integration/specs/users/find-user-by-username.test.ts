import { faker } from '@faker-js/faker';
import { createAccount } from '@integration/utils/create-account.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { findUserByUsername } from '@testing/tools/gql-operations/users/find-by-username.operation';
import { Code } from 'src/common/enums/code.enum';
import { createUserCacheKey } from 'src/users/cache/create-cache-key';
import { UserModel } from 'src/users/graphql/models/user.model';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

describe('Gql - findUserByUsername', () => {
    describe('User not found', () => {
        test('return 404 code and user not found error message', async () => {
            const username = faker.word.noun();
            const response = await testKit.gqlClient.send(
                findUserByUsername({ fields: ['id'], args: username }),
            );
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('User found was not in cache', () => {
        test('store user in cache', async () => {
            const { id, username } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient.send(findUserByUsername({ fields: ['id'], args: username }));
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeDefined();
        });

        test('password hash should not be stored in cache', async () => {
            const { id, username } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient.send(findUserByUsername({ fields: ['id'], args: username }));
            const userInCache = await testKit.cacheManager.get<{ passwordHash: string }>(cacheKey);
            expect(userInCache!.passwordHash).toBeUndefined();
        });

        test('return user in database without password', async () => {
            const { id } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            const res = await testKit.gqlClient
                .send(findUserByUsername({ fields: 'ALL', args: userInDb.username }))
                .expect(success);
            expect(res.body.data.findUserByUsername).toEqual({
                ...userInDb,
                createdAt: userInDb?.createdAt.toISOString(),
                updatedAt: userInDb?.updatedAt.toISOString(),
                roles: userInDb?.roles.map((r: string) => r.toUpperCase()),
                status: userInDb?.status.toUpperCase(),
            });
        });
    });

    describe('User found in cache', () => {
        test('return user from cache', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, sessionCookie, ...user } = await createAccount();
            const cacheKey = createUserCacheKey(user.id);
            await testKit.cacheManager.set<UserModel>(cacheKey, user);
            const res = await testKit.gqlClient.send(
                findUserByUsername({ fields: ['username'], args: user.username }),
            );
            expect(res.body.data.findUserByUsername.username).toBe(user.username);
        });

        test('return user in database without password', async () => {
            const { id } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient
                .send(findUserByUsername({ fields: 'ALL', args: userInDb.username }))
                .expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            const res = await testKit.gqlClient
                .send(findUserByUsername({ fields: 'ALL', args: userInDb.username }))
                .expect(success);
            expect(res.body.data.findUserByUsername).toEqual({
                ...userInDb,
                createdAt: userInDb?.createdAt.toISOString(),
                updatedAt: userInDb?.updatedAt.toISOString(),
                roles: userInDb?.roles.map((r: string) => r.toUpperCase()),
                status: userInDb?.status.toUpperCase(),
            });
        });
    });

    describe('Cache shared with findUserById', () => {
        test('findUserByUsername reads cache populated by findUserById', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient.send(findUserById({ fields: ['id'], args: id }));
            const userInCache = await testKit.cacheManager.get<UserModel>(cacheKey);
            expect(userInCache).toBeDefined();
            const res = await testKit.gqlClient.send(
                findUserByUsername({ fields: ['id', 'username'], args: userInCache!.username }),
            );
            expect(res.body.data.findUserByUsername.id).toBe(id);
        });
    });
});

import { faker } from '@faker-js/faker';
import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { Code } from 'src/common/enums/code.enum';
import { createUserCacheKey } from 'src/users/cache/create-cache-key';
import { UserModel } from 'src/users/graphql/models/user.model';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

describe('Gql - findUserById', () => {
    describe('Invalid postgres id', () => {
        test('return 404 code and user not found error message', async () => {
            const id = faker.food.vegetable();
            const response = await testKit.gqlClient.send(
                findUserById({ fields: ['id'], args: id }),
            );
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('User not found', () => {
        test('return 404 code and user not found error message', async () => {
            const { id } = await createAccount();
            // delete user
            await testKit.userRepos.delete({ id });
            const response = await testKit.gqlClient.send(
                findUserById({ fields: ['id'], args: id }),
            );
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('Items field', () => {
        test('totalCount and items should match the user items', async () => {
            const { id } = await createAccount();
            // create 3 items for the created user
            const userItems = await Promise.all([createItem(id), createItem(id), createItem(id)]);
            // create items for a different users
            await Promise.all([
                createItem((await createAccount()).id),
                createItem((await createAccount()).id),
                createItem((await createAccount()).id),
            ]);
            const { body } = await testKit.gqlClient.send({
                variables: { userId: id, limit: 3 },
                query: `query TestQuery($userId: ID!, $limit: Int!) {
                        findUserById(user_id: $userId) {
                          items(limit: $limit) {
                            totalCount
                            nodes {
                              id
                            }
                          }
                        }
                    }
                `,
            });
            const itemsData = body.data.findUserById.items;
            expect(itemsData.totalCount).toBe(3);
            expect(itemsData.nodes).toEqual(
                expect.arrayContaining(userItems.map(({ id }) => ({ id }))),
            );
        });
    });

    describe('User found was not in cache', () => {
        test('store user in cache', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            // trigger cache
            await testKit.gqlClient.send(findUserById({ fields: ['id'], args: id }));
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeDefined();
        });

        test('password hash should not be stored in cache', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            // trigger cache
            await testKit.gqlClient.send(findUserById({ fields: ['id'], args: id }));
            const userInCache = await testKit.cacheManager.get<{ passwordHash: string }>(cacheKey);
            expect(userInCache!.passwordHash).toBeUndefined();
        });

        test('return user in database without password', async () => {
            const { id } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            const res = await testKit.gqlClient
                .send(findUserById({ fields: 'ALL', args: id }))
                .expect(success);
            expect(res.body.data.findUserById).toEqual({
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
            // save user in cache
            await testKit.cacheManager.set<UserModel>(cacheKey, user);
            const res = await testKit.gqlClient.send(
                findUserById({ fields: ['username'], args: user.id }),
            );
            expect(res.body.data.findUserById.username).toBe(user.username);
        });

        test('return user in database without password', async () => {
            const { id } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            // trigger cache
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient.send(findUserById({ fields: 'ALL', args: id })).expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            // find user
            const res = await testKit.gqlClient
                .send(findUserById({ fields: 'ALL', args: id }))
                .expect(success);
            expect(res.body.data.findUserById).toEqual({
                ...userInDb,
                createdAt: userInDb?.createdAt.toISOString(),
                updatedAt: userInDb?.updatedAt.toISOString(),
                roles: userInDb?.roles.map((r: string) => r.toUpperCase()),
                status: userInDb?.status.toUpperCase(),
            });
        });
    });
});

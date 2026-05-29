import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { me } from '@testing/tools/gql-operations/users/me.operation';
import { Code } from 'src/common/enums/code.enum';
import { createUserCacheKey } from 'src/users/cache/create-cache-key';
import { UserModel } from 'src/users/graphql/models/user.model';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';

describe('Gql - me', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(me({ fields: ['id'] }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('User not found (Zombie Session)', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const { id, sessionCookie } = await createAccount();
            // delete user to trigger zombie session detection
            await testKit.userRepos.delete({ id });
            const response = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: ['id'] }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Items field', () => {
        test('totalCount and items should match the user items', async () => {
            const { id, sessionCookie } = await createAccount();
            // create 3 items for the created user
            const userItems = await Promise.all([createItem(id), createItem(id), createItem(id)]);
            // create items for different users
            await Promise.all([
                createItem((await createAccount()).id),
                createItem((await createAccount()).id),
                createItem((await createAccount()).id),
            ]);
            const { body } = await testKit.gqlClient.set('Cookie', sessionCookie).send({
                variables: { limit: 3 },
                query: `query TestQuery($limit: Int!) {
                            me {
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
            const itemsData = body.data.me.items;
            expect(itemsData.totalCount).toBe(3);
            expect(itemsData.nodes).toEqual(
                expect.arrayContaining(userItems.map(({ id }) => ({ id }))),
            );
        });
    });

    describe('User found was not in cache', () => {
        test('store user in cache', async () => {
            const { id, sessionCookie } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            // trigger cache
            await testKit.gqlClient.set('Cookie', sessionCookie).send(me({ fields: ['id'] }));
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeDefined();
        });

        test('password hash should not be stored in cache', async () => {
            const { id, sessionCookie } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            // trigger cache
            await testKit.gqlClient.set('Cookie', sessionCookie).send(me({ fields: ['id'] }));
            const userInCache = await testKit.cacheManager.get<{ passwordHash: string }>(cacheKey);
            expect(userInCache!.passwordHash).toBeUndefined();
        });

        test('return user in database without password', async () => {
            const { id, sessionCookie } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: 'ALL' }))
                .expect(success);
            expect(res.body.data.me).toEqual({
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
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: ['username'] }));
            expect(res.body.data.me.username).toBe(user.username);
        });

        test('return user in database without password', async () => {
            const { id, sessionCookie } = await createAccount();
            const userInDb = (await testKit.userRepos.findOneBy({ id })) as any;
            delete userInDb.passwordHash;
            delete userInDb.items;
            // trigger cache
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: 'ALL' }))
                .expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            // find user
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: 'ALL' }))
                .expect(success);
            expect(res.body.data.me).toEqual({
                ...userInDb,
                createdAt: userInDb?.createdAt.toISOString(),
                updatedAt: userInDb?.updatedAt.toISOString(),
                roles: userInDb?.roles.map((r: string) => r.toUpperCase()),
                status: userInDb?.status.toUpperCase(),
            });
        });
    });

    describe('Password Exposure Verification', () => {
        test('returned me object does not expose password or passwordHash', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(me({ fields: 'ALL' }))
                .expect(success);
            expect(res.body.data.me.password).toBeUndefined();
            expect(res.body.data.me.passwordHash).toBeUndefined();
        });

        test('querying password field on me should fail GraphQL schema validation', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send({
                query: `query {
                        me {
                            id
                            password
                        }
                    }`,
            });
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain(
                'Cannot query field "password" on type "UserModel".',
            );
        });

        test('querying passwordHash field on me should fail GraphQL schema validation', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send({
                query: `query {
                        me {
                            id
                            passwordHash
                        }
                    }`,
            });
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain(
                'Cannot query field "passwordHash" on type "UserModel".',
            );
        });
    });
});

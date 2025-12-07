import { createAccount } from '@integration/utils/create-account.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { createItem } from '@testing/tools/gql-operations/items/create-item.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('Gql - createItem', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(
                createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }),
            );
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Account with status "pending verification" attempts to create an item', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
            });
            const response = await testKit.gqlClient
                .send(createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('Account with status "suspended" attempts to create an item', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.SUSPENDED });
            const response = await testKit.gqlClient
                .send(createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('Account with status "active" attempts to create an item', () => {
        test('user creates item successfully', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const response = await testKit.gqlClient
                .send(createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).notToFail();
        });
    });

    describe('Active account with role "creator" attempts to create an item', () => {
        test('item created successfully', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            const response = await testKit.gqlClient
                .send(createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).notToFail();
        });
    });

    describe.each([UserRole.REVIEWER, UserRole.MODERATOR, UserRole.ADMIN])(
        'Active account with role "%s" attempts to create an item',
        (role) => {
            test('return forbidden code and forbidden error message', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [role],
                });
                const response = await testKit.gqlClient
                    .send(createItem({ args: testKit.itemSeed.itemInput, fields: ['id'] }))
                    .set('Cookie', sessionCookie);
                expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        },
    );
    describe.each(['title', 'description', 'category'])('Property "%s" not provided', (prop) => {
        test('return bad user input code', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            const itemData = { ...testKit.itemSeed.itemInput };
            delete itemData[prop];
            const response = await testKit.gqlClient
                .send(createItem({ args: itemData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining(prop));
        });
    });

    describe('Item created successfully', () => {
        test('default average_rating is 0', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            const itemData = testKit.itemSeed.itemInput;
            const res = await testKit.gqlClient
                .send(createItem({ args: itemData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const itemId = res.body.data.createItem.id;
            expect(itemId).toBeDefined();
            const itemInDb = await testKit.itemRepos.findOneBy({ id: itemId });
            expect(itemInDb?.averageRating).toBe(0);
        });

        describe('Provided category with uppercase letter and leading and trailing spaces', () => {
            test('category should be transformed to lowercase and leading/trailing spaces removed', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [UserRole.CREATOR],
                });
                const category = ` TeST `;
                const itemData = {
                    ...testKit.itemSeed.itemInput,
                    category,
                };
                await testKit.gqlClient
                    .send(createItem({ args: itemData, fields: ['id'] }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                const itemInDb = await testKit.itemRepos.findOneBy({ title: itemData.title });
                expect(itemInDb?.category).toBe('test');
            });
        });

        describe('Provided title contains uppercase letters and leading and trailing spaces', () => {
            test('uppercase letters are kept but leading and trailing spaces removed', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [UserRole.CREATOR],
                });
                const itemTitle = `  myItemtestTitle  `;
                const itemData = { ...testKit.itemSeed.itemInput, title: itemTitle };
                await testKit.gqlClient
                    .send(createItem({ args: itemData, fields: ['id'] }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                const itemInDb = await testKit.itemRepos.findOneBy({ title: 'myItemtestTitle' });
                expect(itemInDb).not.toBeNull();
            });
        });

        describe('Provided tags contain uppercase letters and leading and trailing spaces', () => {
            test('all the tags should be transformed to lowercase and leading and trailing spaces removed', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [UserRole.CREATOR],
                });
                const tags = ['  TagOne ', 'TAGTwo', ' tagThree  '];
                const itemData = {
                    ...testKit.itemSeed.itemInput,
                    tags,
                };
                await testKit.gqlClient
                    .send(createItem({ args: itemData, fields: ['id'] }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                const itemInDb = await testKit.itemRepos.findOneBy({ title: itemData.title });
                expect(itemInDb?.tags).toStrictEqual(['tagone', 'tagtwo', 'tagthree']);
            });
        });

        describe('Tags not provided', () => {
            test('array in database should be an empty array', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [UserRole.CREATOR],
                });
                const itemData = {
                    title: testKit.itemSeed.title,
                    description: testKit.itemSeed.description,
                    category: testKit.itemSeed.category,
                };
                await testKit.gqlClient
                    .send(createItem({ args: itemData, fields: ['id'] }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                const itemInDb = await testKit.itemRepos.findOneBy({ title: itemData.title });
                expect(itemInDb?.tags).toStrictEqual([]);
            });
        });

        test('user in cookie should be the creator of the item', async () => {
            const { sessionCookie, id } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            const itemData = testKit.itemSeed.itemInput;
            await testKit.gqlClient
                .send(createItem({ args: itemData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const itemInDb = await testKit.itemRepos.findOneBy({ title: itemData.title });
            expect(itemInDb?.createdBy).toBe(id);
        });
    });
});

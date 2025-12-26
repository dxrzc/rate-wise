import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { createReview } from '@integration/utils/create-review.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { testKit } from '@integration/utils/test-kit.util';
import { Item } from 'src/items/entities/item.entity';
import { success } from '@integration/utils/no-errors.util';
import { Code } from 'src/common/enum/code.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { createItemCacheKey } from 'src/items/cache/create-cache-key';

// skipped intentionally. There are plans to change the way the data is filtered so this tests will be removed anyway.
describe.skip('Gql - findAllItemsByUser', () => {
    beforeAll(async () => {
        await testKit.seedService.createUsers(3);
        await testKit.seedService.createItems(3);
        await testKit.seedService.createReviews(3);
    });

    async function createItemsByUser(userId: string, itemsNumber: number = 4): Promise<Item[]> {
        const promises = new Array<Promise<Item>>();
        for (let i = 0; i < itemsNumber; i++) {
            promises.push(createItem(userId));
        }
        return await Promise.all(promises);
    }

    test('return only the items created by user', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const itemsN = 4;
        const userItems = await createItemsByUser(id, itemsN);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: itemsN, userId: id },
        });
        const nodes = <Item[]>response.body.data.findAllItemsByUser.nodes;
        expect(nodes).toBeDefined();
        const idsInNodes = nodes.map((i) => i.id);
        expect(idsInNodes).toEqual(expect.arrayContaining(userItems.map((i) => i.id)));
        expect(idsInNodes).toHaveLength(userItems.length);
    });

    test('total count should match the number of items created by the user', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const itemsByUser = 4;
        await createItemsByUser(id, itemsByUser);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        totalCount
                      }
                    }`,
            variables: { limit: 1, userId: id },
        });
        const totalCountInResponse = response.body.data.findAllItemsByUser.totalCount;
        expect(totalCountInResponse).toBe(itemsByUser);
    });

    test('cache the results', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const itemsN = 3;
        const userItems = await createItemsByUser(id, itemsN);
        // query all items by user
        await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: itemsN, userId: id },
        });
        const itemsIds = userItems.map((i) => i.id);
        for (const itemId of itemsIds)
            await expect(
                testKit.cacheManager.get(createItemCacheKey(itemId)),
            ).resolves.toBeDefined();
    });

    test('should return items with nested reviews', async () => {
        const { id: userId } = await createAccount({ status: AccountStatus.ACTIVE });
        const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
        const [item] = await createItemsByUser(userId, 1);

        // Create reviews for the item
        const reviewsCount = 3;
        for (let i = 0; i < reviewsCount; i++) {
            await createReview(item.id, reviewerId);
        }

        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        nodes {
                          id
                          reviews(limit: 10) {
                            nodes {
                              id
                              content
                              rating
                              createdBy
                            }
                            totalCount
                          }
                        }
                      }
                    }`,
            variables: { limit: 1, userId: userId },
        });

        const nodes = response.body.data.findAllItemsByUser.nodes;
        expect(nodes).toHaveLength(1);
        const itemNode = nodes[0];
        expect(itemNode.id).toBe(item.id);
        expect(itemNode.reviews.nodes).toHaveLength(reviewsCount);
        expect(itemNode.reviews.totalCount).toBe(reviewsCount);
        expect(itemNode.reviews.nodes[0]).toHaveProperty('content');
        expect(itemNode.reviews.nodes[0]).toHaveProperty('rating');
    });

    describe('User does not exist', () => {
        test('return not found code and user not found error message', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            await testKit.userRepos.delete({ id }); // delete user
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        totalCount
                      }
                    }`,
                variables: { limit: 1, userId: id },
            });
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('Invalid uuid', () => {
        test('return not found code and user not found error message', async () => {
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByUser($limit: Int!, $userId: ID!) {
                      findAllItemsByUser(limit: $limit, userId: $userId) {
                        totalCount
                      }
                    }`,
                variables: { limit: 1, userId: '123' },
            });
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });
});

import { createItem } from '@integration/utils/create-item.util';
import { createReview } from '@integration/utils/create-review.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { ITEMS_MESSAGES } from 'src/items/messages/items.messages';
import { createReviewCacheKey } from 'src/reviews/cache/create-cache-key';
import { Review } from 'src/reviews/entities/review.entity';
import { User } from 'src/users/entities/user.entity';

describe('Gql - findAllItemReviews', () => {
    let seededUsers = new Array<User>();

    // simulate existing data
    beforeAll(async () => {
        seededUsers = await testKit.seedService.createUsers(3);
        await testKit.seedService.createItems(3);
        await testKit.seedService.createReviews(2); // 18 reviews
    });

    function getRandomUserId(): string {
        const { id: randomUserId } = seededUsers[Math.floor(Math.random() * seededUsers.length)];
        return randomUserId;
    }

    async function createReviewsForItem(itemId: string, nReviews: number = 3): Promise<Review[]> {
        const promises = new Array<Promise<Review>>();
        for (let i = 0; i < nReviews; i++) {
            promises.push(createReview(itemId, getRandomUserId()));
        }
        return Promise.all(promises);
    }

    test('return only the reviews for item in item id', async () => {
        const { id: itemId } = await createItem(getRandomUserId());
        const nReviews = 5;
        const reviewsForItem = await createReviewsForItem(itemId, nReviews);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemReviews($limit: Int!, $itemId: ID!) {
                        findAllItemReviews(limit: $limit, itemId: $itemId) {
                          nodes {
                            id
                          }
                        }
                    }`,
            variables: {
                limit: nReviews,
                itemId,
            },
        });
        const nodes = <Review[]>response.body.data.findAllItemReviews.nodes;
        const idsInNodes = nodes.map((r) => r.id);
        expect(idsInNodes).toEqual(expect.arrayContaining(reviewsForItem.map((r) => r.id)));
        expect(idsInNodes).toHaveLength(reviewsForItem.length);
    });

    test('total count should match the number of reviews created by the user', async () => {
        const { id: itemId } = await createItem(getRandomUserId());
        const nReviews = 6;
        await createReviewsForItem(itemId, nReviews);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemReviews($limit: Int!, $itemId: ID!) {
                        findAllItemReviews(limit: $limit, itemId: $itemId) {
                          totalCount
                        }
                    }`,
            variables: { limit: nReviews, itemId },
        });
        const totalCount: number = response.body.data.findAllItemReviews.totalCount;
        expect(totalCount).toBe(nReviews);
    });

    test('cache the results', async () => {
        const { id: itemId } = await createItem(getRandomUserId());
        const nReviews = 3;
        const reviewsCreated = await createReviewsForItem(itemId, nReviews);
        // query all reviews for item
        await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemReviews($limit: Int!, $itemId: ID!) {
                        findAllItemReviews(limit: $limit, itemId: $itemId) {
                          nodes {
                            id
                          }
                        }
                    }`,
            variables: { limit: nReviews, itemId },
        });
        const reviewsIds = reviewsCreated.map((r) => r.id);
        for (const reviewId of reviewsIds) {
            await expect(
                testKit.cacheManager.get(createReviewCacheKey(reviewId)),
            ).resolves.toBeDefined();
        }
    });

    describe('Item does not exist', () => {
        test('return not found code and item not found error message', async () => {
            const { id: itemId } = await createItem(getRandomUserId());
            await testKit.itemRepos.delete({ id: itemId });
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemReviews($limit: Int!, $itemId: ID!) {
                        findAllItemReviews(limit: $limit, itemId: $itemId) {
                          totalCount
                        }
                    }`,
                variables: { limit: 2, itemId },
            });
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('Invalid uuid', () => {
        test('return bad request code and invalid input error message', async () => {
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemReviews($limit: Int!, $itemId: ID!) {
                        findAllItemReviews(limit: $limit, itemId: $itemId) {
                          totalCount
                        }
                    }`,
                variables: { limit: 2, itemId: 'badId123' },
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });
});

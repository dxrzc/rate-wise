import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { testKit } from '@integration/utils/test-kit.util';
import { Item } from 'src/items/entities/item.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { success } from '@integration/utils/no-errors.util';
import { Code } from 'src/common/enum/code.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { createReviewCacheKey } from 'src/reviews/cache/create-cache-key';

// skipped intentionally. There are plans to change the way the data is filtered so this tests will be removed anyway.
describe.skip('Gql - findAllReviewsByUser', () => {
    let seededItems = new Array<Item>();

    // simulate existing data
    // beforeAll(async () => {
    //     await testKit.seedService.createUsers(3);
    //     seededItems = await testKit.seedService.createItems(3);
    //     await testKit.seedService.createReviews(3); // 27 reviews
    // });

    async function createReviewsByUser(
        userId: string,
        reviewsNumber: number = 4,
    ): Promise<Review[]> {
        const { id: randomItemId } = seededItems[Math.floor(Math.random() * seededItems.length)];
        const promises = new Array<Promise<Review>>();
        for (let i = 0; i < reviewsNumber; i++) {
            promises.push(createReview(randomItemId, userId));
        }
        return await Promise.all(promises);
    }

    test('return only the reviews created by user', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const reviewsN = 4;
        const userReviews = await createReviewsByUser(id, reviewsN);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllReviewsByUser($limit: Int!, $userId: ID!) {
                      findAllReviewsByUser(limit: $limit, userId: $userId) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: reviewsN, userId: id },
        });
        const nodes = <Review[]>response.body.data.findAllReviewsByUser.nodes;
        expect(nodes).toBeDefined();
        const idsInNodes = nodes.map((r) => r.id);
        expect(idsInNodes).toEqual(expect.arrayContaining(userReviews.map((r) => r.id)));
        expect(idsInNodes).toHaveLength(userReviews.length);
    });

    test('total count should match the number of reviews created by the user', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const reviewsByUser = 4;
        await createReviewsByUser(id, reviewsByUser);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllReviewsByUser($limit: Int!, $userId: ID!) {
                      findAllReviewsByUser(limit: $limit, userId: $userId) {
                        totalCount
                      }
                    }`,
            variables: { limit: 1, userId: id },
        });
        const totalCountInResponse = response.body.data.findAllReviewsByUser.totalCount;
        expect(totalCountInResponse).toBe(reviewsByUser);
    });

    test('cache the results', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const reviewsN = 3;
        const userReviews = await createReviewsByUser(id, 3);
        // query all reviews by user
        await testKit.gqlClient.expect(success).send({
            query: `query FindAllReviewsByUser($limit: Int!, $userId: ID!) {
                      findAllReviewsByUser(limit: $limit, userId: $userId) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: reviewsN, userId: id },
        });
        const reviewsIds = userReviews.map((r) => r.id);
        for (const reviewId of reviewsIds)
            await expect(
                testKit.cacheManager.get(createReviewCacheKey(reviewId)),
            ).resolves.toBeDefined();
    });

    describe('User does not exist', () => {
        test('return not found code and user not found error message', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            await testKit.userRepos.delete({ id }); // delete user
            const response = await testKit.gqlClient.send({
                query: `query FindAllReviewsByUser($limit: Int!, $userId: ID!) {
                      findAllReviewsByUser(limit: $limit, userId: $userId) {
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
                query: `query FindAllReviewsByUser($limit: Int!, $userId: ID!) {
                      findAllReviewsByUser(limit: $limit, userId: $userId) {
                        totalCount
                      }
                    }`,
                variables: { limit: 1, userId: '123' },
            });
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });
});

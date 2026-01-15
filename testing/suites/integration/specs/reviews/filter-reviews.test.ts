import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { createReview } from '@integration/utils/create-review.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { Code } from 'src/common/enum/code.enum';
import { ITEMS_MESSAGES } from 'src/items/messages/items.messages';
import { Review } from 'src/reviews/entities/review.entity';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { VoteAction } from 'src/votes/enum/vote.enum';

describe('Gql - filterReviews', () => {
    beforeAll(async () => {
        // simulates existing data
        const initialReviewCount = 3;
        const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
        for (let i = 0; i < initialReviewCount; i++) {
            const { id: itemId } = await createItem(creatorId);
            const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
            await createReview(itemId, reviewerId);
        }
    });

    describe('"createdBy" and "relatedItem" provided', () => {
        test('return only the review created by the user for the specified item', async () => {
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: itemId } = await createItem(creatorId);
            //  create review
            const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: createdReviewId } = await createReview(itemId, reviewerId);
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query Nodes($limit: Int!, $createdBy: ID, $relatedItem: ID) {
                          filterReviews(limit: $limit, createdBy: $createdBy, relatedItem: $relatedItem) {
                            nodes {
                              id
                              createdAt
                              updatedAt
                              content
                              rating
                              createdBy
                              relatedItem
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: reviewerId,
                    relatedItem: itemId,
                },
            });
            const totalCount = response.body.data.filterReviews.totalCount;
            expect(totalCount).toBe(1);
            const nodes = response.body.data.filterReviews.nodes as Review[];
            expect(nodes.length).toBe(1);
            expect(nodes[0].id).toBe(createdReviewId);
        });
    });

    describe('"relatedItem provided"', () => {
        test('return only the reviews created for the target item', async () => {
            // create 5 reviews for the same item
            const reviewsCount = 5;
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: itemId } = await createItem(creatorId);
            const reviewsCreatedIds: string[] = [];
            for (let i = 0; i < reviewsCount; i++) {
                // different reviewer
                const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
                const { id: reviewId } = await createReview(itemId, reviewerId);
                reviewsCreatedIds.push(reviewId);
            }
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query Nodes($limit: Int!, $relatedItem: ID) {
                          filterReviews(limit: $limit, relatedItem: $relatedItem) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    relatedItem: itemId,
                },
            });
            const totalCount = response.body.data.filterReviews.totalCount;
            expect(totalCount).toBe(reviewsCount);
            const nodes = response.body.data.filterReviews.nodes as Review[];
            expect(nodes.length).toBe(reviewsCount);
            const nodesIds = nodes.map((n) => n.id);
            reviewsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('"createdBy" provided', () => {
        test('return only the reviews created by the specified user', async () => {
            // create 5 items and 5 reviews
            const reviewsCount = 5;
            const reviewsCreatedIds: string[] = [];
            const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
            for (let i = 0; i < reviewsCount; i++) {
                const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
                const { id: itemId } = await createItem(creatorId);
                const { id: reviewId } = await createReview(itemId, reviewerId);
                reviewsCreatedIds.push(reviewId);
            }
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query Nodes($limit: Int!, $createdBy: ID) {
                          filterReviews(limit: $limit, createdBy: $createdBy) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: reviewerId,
                },
            });
            const totalCount = response.body.data.filterReviews.totalCount;
            expect(totalCount).toBe(reviewsCount);
            const nodes = response.body.data.filterReviews.nodes as Review[];
            expect(nodes.length).toBe(reviewsCount);
            const nodesIds = nodes.map((n) => n.id);
            reviewsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('No filters provided', () => {
        test('return all the reviews in database', async () => {
            const allInDbCount = await testKit.reviewRepos.count();
            const response = await testKit.gqlClient.expect(success).send({
                query: `query Nodes($limit: Int!) {
                          filterReviews(limit: $limit) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                },
            });
            const totalCount = response.body.data.filterReviews.totalCount;
            expect(totalCount).toBe(allInDbCount);
            const nodes = response.body.data.filterReviews.nodes as Review[];
            expect(nodes.length).toBe(allInDbCount);
        });
    });

    describe('Invalid createdBy id', () => {
        test('return not found code and user not found error message', async () => {
            const invalidUserId = 'invalidUserUUid12345_';
            const response = await testKit.gqlClient.send({
                query: `query Nodes($limit: Int!, $createdBy: ID) {
                          filterReviews(limit: $limit, createdBy: $createdBy) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: invalidUserId,
                },
            });
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('Invalid relatedItem id', () => {
        test('return not found code and item not found error message', async () => {
            const invalidItemId = 'invalidItemUUid@@@';
            const response = await testKit.gqlClient.send({
                query: `query Nodes($limit: Int!, $relatedItem: ID) {
                          filterReviews(limit: $limit, relatedItem: $relatedItem) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    relatedItem: invalidItemId,
                },
            });
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('Votes field', () => {
        test('returns votes when filtering by createdBy and relatedItem', async () => {
            const inputVotes = {
                UP: VoteAction.UP.toUpperCase(),
                DOWN: VoteAction.DOWN.toUpperCase(),
            };
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: itemId } = await createItem(creatorId);
            const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: reviewId } = await createReview(itemId, reviewerId);
            const reviewItemId = itemId;
            const { sessionCookie: upvoterCookie, id: upvoterId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            const { sessionCookie: downvoterCookie, id: downvoterId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            // create votes
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId, vote: inputVotes.UP } }))
                .set('Cookie', upvoterCookie)
                .expect(success);
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId, vote: inputVotes.DOWN } }))
                .set('Cookie', downvoterCookie)
                .expect(success);
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterReviewsWithVotes($limit: Int!, $votesLimit: Int!, $createdBy: ID, $relatedItem: ID) {
                          filterReviews(limit: $limit, createdBy: $createdBy, relatedItem: $relatedItem) {
                            totalCount
                            nodes {
                              id
                              votes(limit: $votesLimit) {
                                totalCount
                                hasNextPage
                                nodes {
                                  vote
                                  createdBy
                                  relatedReview
                                }
                              }
                            }
                          }
                        }`,
                variables: {
                    limit: 5,
                    votesLimit: 10,
                    createdBy: reviewerId,
                    relatedItem: reviewItemId,
                },
            });
            const review = response.body.data.filterReviews.nodes[0];
            expect(response.body.data.filterReviews.totalCount).toBe(1);
            expect(review.id).toBe(reviewId);
            expect(review.votes.totalCount).toBe(2);
            expect(review.votes.hasNextPage).toBe(false);
            expect(review.votes.nodes).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        createdBy: upvoterId,
                        vote: inputVotes.UP,
                        relatedReview: reviewId,
                    }),
                    expect.objectContaining({
                        createdBy: downvoterId,
                        vote: inputVotes.DOWN,
                        relatedReview: reviewId,
                    }),
                ]),
            );
        });
    });
});

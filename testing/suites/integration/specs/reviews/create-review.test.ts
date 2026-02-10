import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { createReview } from '@testing/tools/gql-operations/reviews/create-review.operation';
import { findItemById } from '@testing/tools/gql-operations/items/find-by-id.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enums/code.enum';
import { Item } from 'src/items/entities/item.entity';
import { ITEMS_MESSAGES } from 'src/items/messages/items.messages';
import { REVIEW_MESSAGES } from 'src/reviews/messages/reviews.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('Gql - createReview', () => {
    async function createItemFromNewAccount(): Promise<Item> {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        return await createItem(id);
    }

    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(
                createReview({ args: testKit.reviewSeed.reviewInput, fields: ['id'] }),
            );
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('User reviews the same item twice', () => {
        test('return conflict code and item already reviewed error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            // review 1st time
            await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            // review again
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.CONFLICT, REVIEW_MESSAGES.ALREADY_REVIEWED);
        });
    });

    describe('Invalid item id provided', () => {
        test('return not found code and item not found error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: 'invalid-uuid',
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('User with account status "pending verification" attempts to create a review', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
            });
            const { id: validItemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: validItemId,
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('User with account status "suspended" attempts to create a review', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.SUSPENDED,
            });
            const { id: validItemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: validItemId,
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('Item in itemId field does not exist', () => {
        test('return not found code and item not found error message', async () => {
            const { id: userId, sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: validItemId } = await createItem(userId);
            await testKit.itemRepos.delete({ id: validItemId }); // delete item to simulate non-existence
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: validItemId,
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('User attempts to review their own items', () => {
        test('return forbidden code and cannot review own item error message', async () => {
            const { id: userId, sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: ownItemId } = await createItem(userId);
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: ownItemId,
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, REVIEW_MESSAGES.CANNOT_REVIEW_OWN_ITEM);
        });
    });

    describe('User with account status "active" and role "reviewer" attempts to create a review', () => {
        test('create review successfully', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const response = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie);
            expect(response).notToFail();
        });
    });

    describe.each([UserRole.CREATOR, UserRole.MODERATOR, UserRole.ADMIN])(
        'Users with account status "active" and role "%s" attempt to create a review',
        (role) => {
            test('return forbidden code and forbidden error message', async () => {
                const { sessionCookie } = await createAccount({
                    status: AccountStatus.ACTIVE,
                    roles: [role],
                });
                const { id: itemId } = await createItemFromNewAccount();
                const reviewData = {
                    ...testKit.reviewSeed.reviewInput,
                    itemId: itemId,
                };
                const response = await testKit.gqlClient
                    .send(createReview({ args: reviewData, fields: ['id'] }))
                    .set('Cookie', sessionCookie);
                expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        },
    );

    describe('Review created successfully', () => {
        test('upVotes should be 0 by default', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.upVotes).toBe(0);
        });

        test('downVotes should be 0 by default', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.downVotes).toBe(0);
        });

        test('rating should be the value provided by the user', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.rating).toBe(reviewData.rating);
        });

        test('content should be the value provided by the user', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.content).toBe(reviewData.content);
        });

        test('user in cookie should be the owner of the review', async () => {
            const { id: userId, sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.createdBy).toBe(userId);
        });

        test('itemId should be the value provided by the user', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: ['id'] }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewId = body.data.createReview.id;
            const reviewInDb = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewInDb!.relatedItem).toBe(itemId);
        });

        test('response should match review in database', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItemFromNewAccount();
            const reviewData = {
                ...testKit.reviewSeed.reviewInput,
                itemId: itemId,
            };
            const { body } = await testKit.gqlClient
                .send(createReview({ args: reviewData, fields: 'ALL' }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const reviewInDb = await testKit.reviewRepos.findOneBy({
                id: body.data.createReview.id,
            });
            expect(body.data.createReview).toEqual({
                ...reviewInDb,
                createdAt: reviewInDb?.createdAt.toISOString(),
                updatedAt: reviewInDb?.updatedAt.toISOString(),
            });
        });

        describe('Item did not contain any reviews', () => {
            describe('Review added for item', () => {
                test('item average rating should be the same rating as the review', async () => {
                    const { sessionCookie } = await createAccount({
                        status: AccountStatus.ACTIVE,
                    });
                    const { id: itemId } = await createItemFromNewAccount();
                    const reviewData = {
                        ...testKit.reviewSeed.reviewInput,
                        itemId,
                    };
                    // create first review for item
                    await testKit.gqlClient
                        .send(createReview({ args: reviewData, fields: ['id'] }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                    const { body } = await testKit.gqlClient
                        .send(
                            findItemById({
                                args: itemId,
                                fields: ['averageRating'],
                            }),
                        )
                        .expect(success);
                    expect(body.data.findItemById.averageRating).toBe(reviewData.rating);
                });
            });

            describe('Multiple reviews created for item', () => {
                test('item average should be an integer value when ratings sum evenly', async () => {
                    const { id: itemId } = await createItemFromNewAccount();
                    const ratings = [10, 10, 10, 10];
                    for (const rating of ratings) {
                        const { sessionCookie } = await createAccount({
                            status: AccountStatus.ACTIVE,
                        });
                        const reviewData = {
                            ...testKit.reviewSeed.reviewInput,
                            itemId,
                            rating,
                        };
                        // create reviews for item using different users
                        await testKit.gqlClient
                            .send(createReview({ args: reviewData, fields: ['id'] }))
                            .set('Cookie', sessionCookie)
                            .expect(success);
                    }
                    const { body } = await testKit.gqlClient
                        .send(
                            findItemById({
                                args: itemId,
                                fields: ['averageRating'],
                            }),
                        )
                        .expect(success);
                    expect(body.data.findItemById.averageRating).toBe(10);
                });

                test('item average should support decimal values when ratings do not sum evenly', async () => {
                    const { id: itemId } = await createItemFromNewAccount();
                    const ratings = [10, 9, 9, 10];
                    for (const rating of ratings) {
                        const { sessionCookie } = await createAccount({
                            status: AccountStatus.ACTIVE,
                        });
                        const reviewData = {
                            ...testKit.reviewSeed.reviewInput,
                            itemId,
                            rating,
                        };
                        // create reviews for item using different users
                        await testKit.gqlClient
                            .send(createReview({ args: reviewData, fields: ['id'] }))
                            .set('Cookie', sessionCookie)
                            .expect(success);
                    }
                    const { body } = await testKit.gqlClient
                        .send(
                            findItemById({
                                args: itemId,
                                fields: ['averageRating'],
                            }),
                        )
                        .expect(success);
                    expect(body.data.findItemById.averageRating).toBe(9.5);
                });
            });
        });
    });
});

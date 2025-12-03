import { voteReview } from '@testing/tools/gql-operations/reviews/vote-review.operation';
import { testKit } from '@integration/utils/test-kit.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { createAccount } from '@integration/utils/create-account.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { createItem } from '@integration/utils/create-item.util';
import { createReview } from '@integration/utils/create-review.util';
import { REVIEW_MESSAGES } from 'src/reviews/messages/reviews.messages';
import { success } from '@integration/utils/no-errors.util';

describe('Gql - voteReview', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(voteReview({ args: '123' }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('User account is suspended', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.SUSPENDED,
            });
            const response = await testKit.gqlClient
                .send(voteReview({ args: '123' }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('User account is pending verification', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
            });
            const response = await testKit.gqlClient
                .send(voteReview({ args: '123' }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('Review not found', () => {
        test('return not found code and review not found error message', async () => {
            const { id: userId, sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
            });
            const { id: itemId } = await createItem(userId);
            const { id: reviewId } = await createReview(itemId, userId);
            await testKit.reviewRepos.delete({ id: reviewId }); // delete review
            const response = await testKit.gqlClient
                .send(voteReview({ args: reviewId }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
        });
    });

    describe('Invalid uuid', () => {
        test('return not found code and review not found error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const response = await testKit.gqlClient
                .send(voteReview({ args: 'invalid-uuid' }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
        });
    });

    test('users can vote other users reviews', async () => {
        const { id: userId1 } = await createAccount({
            status: AccountStatus.ACTIVE,
        });
        const { id: itemId } = await createItem(userId1);
        // create review by user 1
        const { id: reviewId } = await createReview(itemId, userId1);
        const { sessionCookie } = await createAccount({
            status: AccountStatus.ACTIVE,
        });
        // user 2 votes user 1's review
        await testKit.gqlClient
            .send(voteReview({ args: reviewId }))
            .set('Cookie', sessionCookie)
            .expect(success);
    });

    test('users can vote their own reviews', async () => {
        const { id: userId, sessionCookie } = await createAccount({
            status: AccountStatus.ACTIVE,
        });
        const { id: itemId } = await createItem(userId);
        // create review by user
        const { id: reviewId } = await createReview(itemId, userId);
        // user votes own review
        await testKit.gqlClient
            .send(voteReview({ args: reviewId }))
            .set('Cookie', sessionCookie)
            .expect(success);
    });

    describe('Item reviewed successfully', () => {
        describe('Review with 0 votes', () => {
            describe('User votes review', () => {
                test('review should be updated to 1 vote', async () => {
                    const { id: userId, sessionCookie } = await createAccount({
                        status: AccountStatus.ACTIVE,
                    });
                    const { id: itemId } = await createItem(userId);
                    // create review
                    const { id: reviewId } = await createReview(itemId, userId);
                    const reviewBeforeVote = await testKit.reviewRepos.findOneBy({ id: reviewId });
                    expect(reviewBeforeVote?.votes).toBe(0);
                    // vote review
                    await testKit.gqlClient
                        .send(voteReview({ args: reviewId }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                    const reviewAfterVote = await testKit.reviewRepos.findOneBy({ id: reviewId });
                    expect(reviewAfterVote?.votes).toBe(1);
                });
            });
        });

        describe('Review with 12356 votes', () => {
            describe('User votes review', () => {
                test('review should be updated to 12357 votes', async () => {
                    const { id: userId, sessionCookie } = await createAccount({
                        status: AccountStatus.ACTIVE,
                    });
                    const { id: itemId } = await createItem(userId);
                    // create review
                    const { id: reviewId } = await createReview(itemId, userId);
                    // add votes
                    const currentVotes = 12356;
                    await testKit.reviewRepos.update(reviewId, { votes: currentVotes });
                    // vote review
                    await testKit.gqlClient
                        .send(voteReview({ args: reviewId }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                    const reviewAfterVote = await testKit.reviewRepos.findOneBy({
                        id: reviewId,
                    });
                    expect(reviewAfterVote?.votes).toBe(currentVotes + 1);
                });
            });
        });
    });
});

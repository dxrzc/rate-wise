import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { REVIEW_MESSAGES } from 'src/reviews/messages/reviews.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { VoteAction } from 'src/votes/enum/vote.enum';

// GraphQL expects the keys not the values. Keys are in uppercase.
const inputVotes = {
    UP: VoteAction.UP.toUpperCase(),
    DOWN: VoteAction.DOWN.toUpperCase(),
};

describe('Gql - voteReview', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(
                voteReview({ args: { reviewId: 'some-review-id', vote: inputVotes.UP } }),
            );
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(['reviewId', 'vote'] as const)('Missing required field: %s', (missingField) => {
        test('return bad user input code', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const voteData: Record<string, any> = {
                reviewId: 'some-review-id',
                vote: inputVotes.UP,
            };
            delete voteData[missingField];
            const response = await testKit.gqlClient
                .send(voteReview({ args: voteData as any }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining(missingField));
        });
    });

    describe('Account status is pending verification', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.PENDING_VERIFICATION,
            });
            const response = await testKit.gqlClient
                .send(voteReview({ args: { reviewId: 'some-review-id', vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('Account status is suspended', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.SUSPENDED,
            });
            const response = await testKit.gqlClient
                .send(voteReview({ args: { reviewId: 'some-review-id', vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe.each([UserRole.MODERATOR, UserRole.ADMIN, UserRole.CREATOR])(
        'Account is active and roles are [%s]',
        (role: UserRole) => {
            test('user can not perform this action (forbidden code and error message)', async () => {
                const { sessionCookie } = await createAccount({
                    roles: [role],
                    status: AccountStatus.ACTIVE,
                });
                const response = await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: 'some-review-id', vote: inputVotes.UP } }))
                    .set('Cookie', sessionCookie);
                expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        },
    );

    describe('Review does not exist', () => {
        test('return not found code and not found error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const { id: reviewId } = await createReview();
            // delete review
            await testKit.reviewRepos.delete(reviewId);
            // try to vote the deleted review
            const response = await testKit.gqlClient
                .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
        });
    });

    describe('Review id is not a valid uuid', () => {
        test('return bad request code and invalid input error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const response = await testKit.gqlClient
                .send(voteReview({ args: { reviewId: 'invalid-uuid', vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('User has downvoted the review', () => {
        describe('User upvotes the review', () => {
            test('remove downvote and add upvote', async () => {
                const { id: reviewId } = await createReview();
                const { sessionCookie } = await createAccount({
                    roles: [UserRole.REVIEWER],
                    status: AccountStatus.ACTIVE,
                });
                // downvote the review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.DOWN } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // upvote the same review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // should exist 1 vote with UP action
                const votes = await testKit.votesRepos.find({
                    where: { review: { id: reviewId } },
                });
                expect(votes).toHaveLength(1);
                expect(votes[0].vote).toBe(VoteAction.UP);
            });
        });

        describe('User downvotes the review again', () => {
            test('do nothing and return success', async () => {
                const { id: reviewId } = await createReview();
                const { sessionCookie } = await createAccount({
                    roles: [UserRole.REVIEWER],
                    status: AccountStatus.ACTIVE,
                });
                // downvote the review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.DOWN } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // downvote the same review again
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.DOWN } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // should exist 1 vote with DOWN action
                const votes = await testKit.votesRepos.find({
                    where: { review: { id: reviewId } },
                });
                expect(votes).toHaveLength(1);
                expect(votes[0].vote).toBe(VoteAction.DOWN);
            });
        });
    });

    describe('User has upvoted the review', () => {
        describe('User downvotes the review', () => {
            test('remove upvote and add downvote', async () => {
                const { id: reviewId } = await createReview();
                const { sessionCookie } = await createAccount({
                    roles: [UserRole.REVIEWER],
                    status: AccountStatus.ACTIVE,
                });
                // upvote the review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // downvote the same review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.DOWN } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // should exist 1 vote with DOWN action
                const votes = await testKit.votesRepos.find({
                    where: { review: { id: reviewId } },
                });
                expect(votes).toHaveLength(1);
                expect(votes[0].vote).toBe(VoteAction.DOWN);
            });
        });

        describe('User upvotes the review again', () => {
            test('do nothing and return success', async () => {
                const { id: reviewId } = await createReview();
                const { sessionCookie } = await createAccount({
                    roles: [UserRole.REVIEWER],
                    status: AccountStatus.ACTIVE,
                });
                // upvote the review
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // upvote the same review again
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
                // should exist 1 vote with UP action
                const votes = await testKit.votesRepos.find({
                    where: { review: { id: reviewId } },
                });
                expect(votes).toHaveLength(1);
                expect(votes[0].vote).toBe(VoteAction.UP);
            });
        });
    });

    describe('User is deleted', () => {
        test('remove vote from review', async () => {
            const { id: reviewId } = await createReview();
            const { sessionCookie, id: userId } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            // upvote the review
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie)
                .expect(success);
            // verify vote exists
            const votesBefore = await testKit.votesRepos.find({
                where: { review: { id: reviewId } },
            });
            expect(votesBefore).toHaveLength(1);
            // delete user
            await testKit.userRepos.delete(userId);
            // verify vote is removed
            const votesAfter = await testKit.votesRepos.find({
                where: { review: { id: reviewId } },
            });
            expect(votesAfter).toHaveLength(0);
        });
    });

    describe('Vote successfully created', () => {
        test('update review downvotes if downvoted', async () => {
            const { id: reviewId } = await createReview();
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            // downvote the review
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.DOWN } }))
                .set('Cookie', sessionCookie)
                .expect(success);
            // fetch the review and verify downvotes count
            const review = await testKit.reviewRepos.findOne({
                where: { id: reviewId },
            });
            expect(review?.downVotes).toBe(1);
        });

        test('update review upvotes if upvoted', async () => {
            const { id: reviewId } = await createReview();
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            // upvote the review
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie)
                .expect(success);
            // fetch the review and verify upvotes count
            const review = await testKit.reviewRepos.findOne({
                where: { id: reviewId },
            });
            expect(review?.upVotes).toBe(1);
        });
    });
});

import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { deleteVote, voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enums/code.enum';
import { REVIEW_MESSAGES } from 'src/reviews/messages/reviews.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { VoteAction } from 'src/votes/enum/vote.enum';

const inputVotes = {
    UP: VoteAction.UP.toUpperCase(),
};

describe('Gql - deleteVote', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(deleteVote({ args: 'some-review-id' }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Account status is pending verification', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.PENDING_VERIFICATION,
            });
            const response = await testKit.gqlClient
                .send(deleteVote({ args: 'some-review-id' }))
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
                .send(deleteVote({ args: 'some-review-id' }))
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
                    .send(deleteVote({ args: 'some-review-id' }))
                    .set('Cookie', sessionCookie);
                expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        },
    );

    describe('Review does not exist', () => {
        test('return not found code and review not found error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const response = await testKit.gqlClient
                .send(deleteVote({ args: '00000000-0000-0000-0000-000000000000' }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
        });
    });

    describe('User has voted on the review', () => {
        test('delete vote successfully and return true', async () => {
            const { sessionCookie, id: userId } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const { id: reviewId } = await createReview(undefined, userId);

            // First vote
            await testKit.gqlClient
                .send(voteReview({ args: { reviewId: reviewId, vote: inputVotes.UP } }))
                .set('Cookie', sessionCookie)
                .expect(success);

            // Then delete vote
            const response = await testKit.gqlClient
                .send(deleteVote({ args: reviewId }))
                .set('Cookie', sessionCookie);

            expect(response.body.data.deleteVote).toBe(true);
        });
    });

    describe('User has NOT voted on the review', () => {
        test('return false', async () => {
            const { sessionCookie, id: userId } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const { id: reviewId } = await createReview(undefined, userId);

            const response = await testKit.gqlClient
                .send(deleteVote({ args: reviewId }))
                .set('Cookie', sessionCookie);

            expect(response.body.data.deleteVote).toBe(false);
        });
    });

    describe('Rapid voting', () => {
        test('concurrent vote and delete requests should result in consistent state', async () => {
            const { sessionCookie, id: userId } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const { id: reviewId } = await createReview(undefined, userId);
            const iterations = 10;
            const promises: Promise<any>[] = [];
            for (let i = 0; i < iterations; i++) {
                let operation: any;
                // Mix of vote and delete requests
                if (i % 2 === 0) {
                    operation = testKit.gqlClient
                        .send(voteReview({ args: { reviewId, vote: inputVotes.UP } }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                } else {
                    operation = testKit.gqlClient
                        .send(deleteVote({ args: reviewId }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                }
                promises.push(operation);
            }
            await Promise.all(promises);
            // Check final state
            const review = await testKit.reviewRepos.findOne({ where: { id: reviewId } });
            const vote = await testKit.votesRepos.findOne({
                where: { relatedReview: reviewId, createdBy: userId },
            });
            if (vote) {
                expect(review?.upVotes).toBe(1);
            } else {
                expect(review?.upVotes).toBe(0);
            }
            expect(review?.downVotes).toBe(0);
        });
    });
});

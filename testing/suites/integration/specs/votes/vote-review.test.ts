import { createAccount } from '@integration/utils/create-account.util';
import { testKit } from '@integration/utils/test-kit.util';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { REVIEW_MESSAGES } from 'src/reviews/messages/reviews.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { VoteAction } from 'src/votes/enum/vote.enum';

describe('Gql - upVoteReview', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(
                voteReview({ args: { reviewId: 'some-review-id', vote: VoteAction.UP } }),
            );
            console.log(response.body);
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(['reviewId', 'vote'] as const)('Missing required field: %s', (missingField) => {
        test('return bad request code and invalid input error message', async () => {
            const { sessionCookie } = await createAccount({
                roles: [UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            const voteData: Record<string, any> = {
                reviewId: 'some-review-id',
                vote: VoteAction.UP,
            };
            delete voteData[missingField];
            const response = await testKit.gqlClient
                .send(voteReview({ args: voteData as any }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe.each([AccountStatus.PENDING_VERIFICATION, AccountStatus.SUSPENDED])(
        'Account status is %s',
        (status: AccountStatus) => {
            test('user can not perform this action (forbidden code and error message)', async () => {
                const { sessionCookie } = await createAccount({
                    roles: [UserRole.REVIEWER],
                    status,
                });
                const response = await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: 'some-review-id', vote: VoteAction.UP } }))
                    .set('Cookie', sessionCookie);
                expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
            });
        },
    );

    describe.each([UserRole.MODERATOR, UserRole.ADMIN, UserRole.CREATOR])(
        'Account roles are [%s]',
        (role: UserRole) => {
            test('user can not perform this action (forbidden code and error message)', async () => {
                const { sessionCookie } = await createAccount({
                    roles: [role],
                    status: AccountStatus.ACTIVE,
                });
                const response = await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: 'some-review-id', vote: VoteAction.UP } }))
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
            const response = await testKit.gqlClient
                .send(voteReview({ args: { reviewId: 'some-review-id', vote: VoteAction.UP } }))
                .set('Cookie', sessionCookie);
            expect(response).toFailWith(Code.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
        });
    });

    describe('Review id is not a valid uuid', () => {});
});

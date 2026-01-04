import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { SystemLogger } from 'src/common/logging/system.logger';
import { ReviewService } from 'src/reviews/reviews.service';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { VoteAction } from 'src/votes/enum/vote.enum';

describe('Refresh Reviews CronJob', () => {
    beforeAll(() => {
        // disable logging
        jest.spyOn(SystemLogger.getInstance(), 'log').mockImplementation(() => {});
    });

    describe('Review has zero votes count', () => {
        describe('Vote records exist in database', () => {
            test('should update review votes based on vote records', async () => {
                const { id: reviewId } = await createReview();
                const numberOfVotes = 3;
                // add 3 upvotes for the review
                for (let i = 0; i < numberOfVotes; i++) {
                    const voteAction = VoteAction.UP.toUpperCase();
                    const { sessionCookie } = await createAccount({
                        status: AccountStatus.ACTIVE,
                    });
                    await testKit.gqlClient
                        .send(voteReview({ args: { reviewId: reviewId, vote: voteAction } }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                }
                // add 3 downvotes for the review
                for (let i = 0; i < numberOfVotes; i++) {
                    const voteAction = VoteAction.DOWN.toUpperCase();
                    const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
                    await testKit.gqlClient
                        .send(voteReview({ args: { reviewId: reviewId, vote: voteAction } }))
                        .set('Cookie', sessionCookie)
                        .expect(success);
                }
                // check votes exist for review
                const reviewBeforeRefresh = await testKit.reviewRepos.findOneBy({ id: reviewId });
                expect(reviewBeforeRefresh!.upVotes).toBe(numberOfVotes);
                expect(reviewBeforeRefresh!.downVotes).toBe(numberOfVotes);
                // votes are zeroed out
                await testKit.reviewRepos.update(reviewId, {
                    upVotes: 0,
                    downVotes: 0,
                });
                // update the review votes using the cron job
                const reviewSvc = testKit.app.get(ReviewService);
                await reviewSvc.refreshReviewVotes();
                // fetch review
                const updatedReview = await testKit.reviewRepos.findOneBy({ id: reviewId });
                // validate votes
                expect(updatedReview!.upVotes).toBe(numberOfVotes);
                expect(updatedReview!.downVotes).toBe(numberOfVotes);
            });
        });
    });

    describe('Review has non-zero vote counts', () => {
        describe('No records exist in database', () => {
            test('should reset review votes to zero', async () => {
                const { id: reviewId } = await createReview();
                // manually set non-zero votes
                const initialUpVotes = 5;
                const initialDownVotes = 3;
                await testKit.reviewRepos.update(reviewId, {
                    upVotes: initialUpVotes,
                    downVotes: initialDownVotes,
                });
                // validate votes are set
                const reviewBeforeRefresh = await testKit.reviewRepos.findOneBy({ id: reviewId });
                expect(reviewBeforeRefresh!.upVotes).toBe(initialUpVotes);
                expect(reviewBeforeRefresh!.downVotes).toBe(initialDownVotes);
                // execute job
                const reviewSvc = testKit.app.get(ReviewService);
                await reviewSvc.refreshReviewVotes();
                // fetch review
                const updatedReview = await testKit.reviewRepos.findOneBy({ id: reviewId });
                // validate votes reset to zero
                expect(updatedReview!.upVotes).toBe(0);
                expect(updatedReview!.downVotes).toBe(0);
            });
        });
    });

    describe('Review votes are in a correct state', () => {
        test('should not modify review', async () => {
            const { id: reviewId } = await createReview();
            const numberOfVotes = 2;
            // add 2 upvotes for the review
            for (let i = 0; i < numberOfVotes; i++) {
                const voteAction = VoteAction.UP.toUpperCase();
                const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: voteAction } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
            }
            // add 2 downvotes for the review
            for (let i = 0; i < numberOfVotes; i++) {
                const voteAction = VoteAction.DOWN.toUpperCase();
                const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
                await testKit.gqlClient
                    .send(voteReview({ args: { reviewId: reviewId, vote: voteAction } }))
                    .set('Cookie', sessionCookie)
                    .expect(success);
            }
            // check votes exist for review
            const reviewBeforeRefresh = await testKit.reviewRepos.findOneBy({ id: reviewId });
            expect(reviewBeforeRefresh!.upVotes).toBe(numberOfVotes);
            expect(reviewBeforeRefresh!.downVotes).toBe(numberOfVotes);
            // execute job
            const reviewSvc = testKit.app.get(ReviewService);
            await reviewSvc.refreshReviewVotes();
            // fetch review
            const updatedReview = await testKit.reviewRepos.findOneBy({ id: reviewId });
            // votes remain unchanged
            expect(updatedReview!.upVotes).toBe(numberOfVotes);
            expect(updatedReview!.downVotes).toBe(numberOfVotes);
        });
    });
});

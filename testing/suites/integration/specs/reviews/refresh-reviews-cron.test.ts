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

    test('should refresh review votes correctly when votes are missing', async () => {
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
        // remove votes
        await testKit.reviewRepos.update(reviewId, {
            upVotes: 0,
            downVotes: 0,
        });
        // execute job
        const reviewSvc = testKit.app.get(ReviewService);
        await reviewSvc.refreshReviewVotes();
        // fetch review
        const updatedReview = await testKit.reviewRepos.findOneBy({ id: reviewId });
        // validate votes
        expect(updatedReview!.upVotes).toBe(numberOfVotes);
        expect(updatedReview!.downVotes).toBe(numberOfVotes);
    });

    test('should not modify reviews with a correct votes state', async () => {
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
        // validate votes
        expect(updatedReview!.upVotes).toBe(numberOfVotes);
        expect(updatedReview!.downVotes).toBe(numberOfVotes);
    });
});

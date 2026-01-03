import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { createVote } from '@integration/utils/create-vote.util';
import { testKit } from '@integration/utils/test-kit.util';
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
            const { id: voterId } = await createAccount({ status: AccountStatus.ACTIVE });
            await createVote({ reviewId, voterId, action: VoteAction.UP });
        }
        // add 3 downvotes for the review
        for (let i = 0; i < numberOfVotes; i++) {
            const { id: voterId } = await createAccount({ status: AccountStatus.ACTIVE });
            await createVote({ reviewId, voterId, action: VoteAction.DOWN });
        }
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
            const { id: voterId } = await createAccount({ status: AccountStatus.ACTIVE });
            await createVote({ reviewId, voterId, action: VoteAction.UP });
        }
        // add 2 downvotes for the review
        for (let i = 0; i < numberOfVotes; i++) {
            const { id: voterId } = await createAccount({ status: AccountStatus.ACTIVE });
            await createVote({ reviewId, voterId, action: VoteAction.DOWN });
        }
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

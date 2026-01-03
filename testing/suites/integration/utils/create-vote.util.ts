import { VoteAction } from 'src/votes/enum/vote.enum';
import { testKit } from './test-kit.util';
import { Vote } from 'src/votes/entities/vote.entity';

export async function createVote({
    reviewId,
    voterId,
    action = Math.random() < 0.5 ? VoteAction.UP : VoteAction.DOWN,
}: {
    reviewId: string;
    voterId: string;
    action?: VoteAction;
}): Promise<Vote> {
    const vote = await testKit.votesRepos.save({
        relatedReview: reviewId,
        createdBy: voterId,
        vote: action,
    });
    return vote;
}

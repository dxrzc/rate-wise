import { createAndVerifyAccount } from '@e2e/utils/create-and-verify-account.util';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { createItem } from '@testing/tools/gql-operations/items/create-item.operation';
import { findItemById } from '@testing/tools/gql-operations/items/find-by-id.operation';
import { createReview } from '@testing/tools/gql-operations/reviews/create-review.operation';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { ReviewModel } from 'src/reviews/graphql/models/review.model';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { VotePaginationModel } from 'src/votes/graphql/models/pagination.model';

describe('Review voting flow', () => {
    test('voting a review updates the review for the item', async () => {
        const { client: client1 } = await createAndVerifyAccount();
        const { client: client2 } = await createAndVerifyAccount();
        const { client: client3 } = await createAndVerifyAccount();
        // client 3 creates item
        const itemCreation = await client3.graphQL(
            createItem({
                args: e2eKit.itemsSeed.itemInput,
                fields: ['id'],
            }),
        );
        expect(itemCreation).notToFail();
        const itemId = itemCreation.body.data.createItem.id;
        // client 2 reviews item
        const reviewCreation = await client2.graphQL(
            createReview({
                args: { ...e2eKit.reviewSeed.reviewInput, itemId },
                fields: ['id'],
            }),
        );
        expect(reviewCreation).notToFail();
        const reviewId = reviewCreation.body.data.createReview.id;
        // client 1 votes review
        const vote = VoteAction.UP.toUpperCase();
        const voteCreation = await client1.graphQL(
            voteReview({
                args: { reviewId, vote },
            }),
        );
        expect(voteCreation).notToFail();
        // find item
        const itemFound = await client1.graphQL(
            findItemById({
                args: itemId,
                fields: ['id'],
                append: `
                    reviews {
                      nodes {
                        id
                        upVotes,
                        downVotes
                      }
                    }
                `,
            }),
        );
        const itemReviewsFetched = <(ReviewModel & { votes: VotePaginationModel })[]>(
            itemFound.body.data.findItemById.reviews.nodes
        );
        expect(itemReviewsFetched.length).toBe(1);
        // review for the item should contain the upvote
        const reviewFetched = itemReviewsFetched.at(0)!;
        expect(reviewFetched.upVotes).toBe(1);
        expect(reviewFetched.downVotes).toBe(0);
    });
});

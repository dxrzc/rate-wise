import { Field, ObjectType } from '@nestjs/graphql';
import { VoteAction } from '../enum/vote.enum';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({
    description: `
        Vote model representing a user's vote for a review.
    `,
})
export class VoteModel extends BaseModel {
    @Field(() => VoteAction, { description: 'The action of the vote (UP or DOWN).' })
    vote!: VoteAction;

    @Field(() => String, {
        description: 'The ID of the user who created this vote.',
    })
    createdBy!: string;

    @Field(() => String, {
        description: 'The ID of the review this vote is for.',
    })
    relatedReview!: string;
}

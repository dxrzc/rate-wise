import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ReviewVotesArgs {
    @Field(() => String, {
        description: 'The unique ID of the review for which to fetch votes.',
    })
    reviewId!: string;
}

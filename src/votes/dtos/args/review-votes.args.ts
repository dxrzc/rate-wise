import { ArgsType, Field } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ReviewVotesArgs extends PaginationArgs {
    @Field(() => String, {
        description: 'The unique ID of the review for which to fetch votes.',
    })
    reviewId!: string;
}

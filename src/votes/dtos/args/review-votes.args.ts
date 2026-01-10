import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsDefined } from 'class-validator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ReviewVotesArgs extends PaginationArgs {
    @IsDefined()
    @Field(() => ID, {
        description: 'The unique ID of the review for which to fetch votes.',
    })
    reviewId!: string;
}

import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsDefined } from 'class-validator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ItemReviewsArgs extends PaginationArgs {
    @IsDefined()
    @Field(() => ID, {
        description: 'The unique ID of the item whose reviews to retrieve.',
    })
    itemId!: string;
}

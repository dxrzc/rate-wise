import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsDefined } from 'class-validator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ItemsByUserArgs extends PaginationArgs {
    @IsDefined()
    @Field(() => ID, {
        description: 'The unique ID of the user whose items to retrieve.',
    })
    userId!: string;
}

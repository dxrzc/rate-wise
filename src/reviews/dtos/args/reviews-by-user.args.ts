import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsDefined, IsUUID } from 'class-validator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ReviewsByUserArgs extends PaginationArgs {
    @IsUUID()
    @IsDefined()
    @Field(() => ID)
    userId!: string;
}

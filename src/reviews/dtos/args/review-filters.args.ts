import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ReviewFiltersArgs extends PaginationArgs {
    @IsOptional()
    @IsString()
    @Field(() => ID, { description: 'ID of the user who created the review', nullable: true })
    createdBy?: string;

    @IsOptional()
    @IsString()
    @Field(() => ID, { description: 'ID of the item being reviewed', nullable: true })
    relatedItem?: string;
}

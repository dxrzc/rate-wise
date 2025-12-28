import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { ITEMS_LIMITS } from '../../constants/items.constants';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ItemFiltersArgs extends PaginationArgs {
    @IsOptional()
    @IsString()
    @Field(() => ID, { description: 'ID of the user who created the item', nullable: true })
    createdBy?: string;

    @IsOptional()
    @IsString()
    @MinLength(ITEMS_LIMITS.CATEGORY.MIN)
    @MaxLength(ITEMS_LIMITS.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        nullable: true,
        description: `Filter items by category. Minimum length: ${ITEMS_LIMITS.CATEGORY.MIN}, Maximum length: ${ITEMS_LIMITS.CATEGORY.MAX}.`,
    })
    category?: string;

    @IsOptional()
    @IsString()
    @MinLength(ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH)
    @MaxLength(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        nullable: true,
        description: `Filter items by tag. Minimum length: ${ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH}, Maximum length: ${ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH}.`,
    })
    tag?: string;
}

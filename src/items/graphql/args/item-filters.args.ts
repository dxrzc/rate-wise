import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimAndLowercase } from 'src/common/utils/trim-and-lowercase.util';
import { ITEM_RULES } from '../../policy/items.rules';
import { PaginationArgs } from 'src/common/graphql/pagination.args';

@ArgsType()
export class ItemFiltersArgs extends PaginationArgs {
    @IsOptional()
    @IsString()
    @Field(() => ID, { description: 'ID of the user who created the item', nullable: true })
    createdBy?: string;

    @IsOptional()
    @IsString()
    @MinLength(ITEM_RULES.CATEGORY.MIN)
    @MaxLength(ITEM_RULES.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        nullable: true,
        description: `Filter items by category. Minimum length: ${ITEM_RULES.CATEGORY.MIN}, Maximum length: ${ITEM_RULES.CATEGORY.MAX}.`,
    })
    category?: string;

    @IsOptional()
    @IsString()
    @MinLength(ITEM_RULES.TAGS.TAG_MIN_LENGTH)
    @MaxLength(ITEM_RULES.TAGS.TAG_MAX_LENGTH)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        nullable: true,
        description: `Filter items by tag. Minimum length: ${ITEM_RULES.TAGS.TAG_MIN_LENGTH}, Maximum length: ${ITEM_RULES.TAGS.TAG_MAX_LENGTH}.`,
    })
    tag?: string;
}

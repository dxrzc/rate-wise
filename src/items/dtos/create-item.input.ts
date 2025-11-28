import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { trimAndLowerCaseArray } from 'src/common/functions/utils/trim-and-lowercase-array.util';
import { ITEMS_LIMITS } from '../constants/items.constants';
import { trim } from 'src/common/functions/utils/trim.util';

@InputType({ description: 'Input type for creating a new item' })
export class CreateItemInput {
    @IsString()
    @MinLength(ITEMS_LIMITS.TITLE.MIN)
    @MaxLength(ITEMS_LIMITS.TITLE.MAX)
    @Transform(trim)
    @Field(() => String, {
        description: `The title of the item. Minimum length: ${ITEMS_LIMITS.TITLE.MIN}, Maximum length: ${ITEMS_LIMITS.TITLE.MAX}.`,
    })
    title!: string;

    @Field(() => String, {
        description: `A detailed description of the item. Minimum length: ${ITEMS_LIMITS.DESCRIPTION.MIN}, Maximum length: ${ITEMS_LIMITS.DESCRIPTION.MAX}.`,
    })
    @IsString()
    @MinLength(ITEMS_LIMITS.DESCRIPTION.MIN)
    @MaxLength(ITEMS_LIMITS.DESCRIPTION.MAX)
    description!: string;

    @IsString()
    @MinLength(ITEMS_LIMITS.CATEGORY.MIN)
    @MaxLength(ITEMS_LIMITS.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        description: `The category of the item. Minimum length: ${ITEMS_LIMITS.CATEGORY.MIN}, Maximum length: ${ITEMS_LIMITS.CATEGORY.MAX}.`,
    })
    category!: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(ITEMS_LIMITS.TAGS.MAX_ARRAY_SIZE)
    @IsString({ each: true })
    @MinLength(ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH, { each: true })
    @MaxLength(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH, { each: true })
    @Transform(trimAndLowerCaseArray)
    @Field(() => [String], {
        nullable: true,
        defaultValue: [],
        description: `Optional tags for the item. Maximum ${ITEMS_LIMITS.TAGS.MAX_ARRAY_SIZE} tags, each between ${ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH}-${ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH} characters.`,
    })
    tags?: string[];
}

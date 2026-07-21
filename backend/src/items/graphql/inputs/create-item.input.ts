import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import { trimAndLowercase } from 'src/common/utils/trim-and-lowercase.util';
import { trimAndLowerCaseArray } from 'src/common/utils/trim-and-lowercase-array.util';
import { ITEM_RULES } from '../../policy/items.rules';
import { trim } from 'src/common/utils/trim.util';

@InputType({ description: 'Input type for creating a new item' })
export class CreateItemInput {
    @IsString()
    @MinLength(ITEM_RULES.TITLE.MIN)
    @MaxLength(ITEM_RULES.TITLE.MAX)
    @Transform(trim)
    @Field(() => String, {
        description: `The title of the item. Minimum length: ${ITEM_RULES.TITLE.MIN}, Maximum length: ${ITEM_RULES.TITLE.MAX}.`,
    })
    readonly title!: string;

    @IsString()
    @MinLength(ITEM_RULES.DESCRIPTION.MIN)
    @MaxLength(ITEM_RULES.DESCRIPTION.MAX)
    @Transform(trim)
    @Field(() => String, {
        description: `A detailed description of the item. Minimum length: ${ITEM_RULES.DESCRIPTION.MIN}, Maximum length: ${ITEM_RULES.DESCRIPTION.MAX}.`,
    })
    readonly description!: string;

    @IsString()
    @MinLength(ITEM_RULES.CATEGORY.MIN)
    @MaxLength(ITEM_RULES.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        description: `The category of the item. Minimum length: ${ITEM_RULES.CATEGORY.MIN}, Maximum length: ${ITEM_RULES.CATEGORY.MAX}.`,
    })
    readonly category!: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(ITEM_RULES.TAGS.MAX_ARRAY_SIZE)
    @IsString({ each: true })
    @MinLength(ITEM_RULES.TAGS.TAG_MIN_LENGTH, { each: true })
    @MaxLength(ITEM_RULES.TAGS.TAG_MAX_LENGTH, { each: true })
    @Transform(trimAndLowerCaseArray)
    @Field(() => [String], {
        nullable: true,
        defaultValue: [],
        description: `Optional tags for the item. Maximum ${ITEM_RULES.TAGS.MAX_ARRAY_SIZE} tags, each between ${ITEM_RULES.TAGS.TAG_MIN_LENGTH}-${ITEM_RULES.TAGS.TAG_MAX_LENGTH} characters.`,
    })
    readonly tags?: string[];
}

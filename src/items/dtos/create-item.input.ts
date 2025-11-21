import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { trimAndLowerCaseArray } from 'src/common/functions/utils/trim-and-lowercase-array.util';
import { ITEMS_LIMITS } from '../constants/items.constants';

@InputType({ description: 'Input type for creating a new item' })
export class CreateItemInput {
    @IsString()
    @MinLength(ITEMS_LIMITS.TITLE.MIN)
    @MaxLength(ITEMS_LIMITS.TITLE.MAX)
    @Field(() => String)
    title!: string;

    @Field(() => String)
    @IsString()
    @MinLength(ITEMS_LIMITS.DESCRIPTION.MIN)
    @MaxLength(ITEMS_LIMITS.DESCRIPTION.MAX)
    description!: string;

    @IsString()
    @MinLength(ITEMS_LIMITS.CATEGORY.MIN)
    @MaxLength(ITEMS_LIMITS.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String)
    category!: string;

    @IsArray()
    @ArrayMaxSize(ITEMS_LIMITS.TAGS.MAX_ARRAY_SIZE)
    @ArrayMinSize(ITEMS_LIMITS.TAGS.MIN_ARRAY_SIZE)
    @IsString({ each: true })
    @MinLength(ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH, { each: true })
    @MaxLength(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH, { each: true })
    @Transform(trimAndLowerCaseArray)
    @Field(() => [String])
    tags!: string[];
}

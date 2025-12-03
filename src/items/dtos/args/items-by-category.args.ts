import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { ITEMS_LIMITS } from '../../constants/items.constants';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ItemsByCategoryArgs extends PaginationArgs {
    @IsString()
    @MinLength(ITEMS_LIMITS.CATEGORY.MIN)
    @MaxLength(ITEMS_LIMITS.CATEGORY.MAX)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        description: `The category to filter items by. Minimum length: ${ITEMS_LIMITS.CATEGORY.MIN}, Maximum length: ${ITEMS_LIMITS.CATEGORY.MAX}.`,
    })
    category!: string;
}

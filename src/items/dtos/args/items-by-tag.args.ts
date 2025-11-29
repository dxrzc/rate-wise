import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { ITEMS_LIMITS } from '../../constants/items.constants';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

@ArgsType()
export class ItemsByTagArgs extends PaginationArgs {
    @IsString()
    @MinLength(ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH)
    @MaxLength(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH)
    @Transform(trimAndLowercase)
    @Field(() => String, {
        description: `The tag to filter items by. Minimum length: ${ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH}, Maximum length: ${ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH}.`,
    })
    tag!: string;
}

import { Field, InputType, Int } from '@nestjs/graphql';
import {
    IsDefined,
    IsInt,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';
import { REVIEWS_LIMITS } from '../constants/reviews.constant';
import { Transform } from 'class-transformer';
import { trim } from 'src/common/functions/utils/trim.util';

@InputType({
    description: 'Input data required to create a new review for an item.',
})
export class CreateReviewInput {
    @IsDefined()
    @IsString()
    @MinLength(REVIEWS_LIMITS.CONTENT.MIN)
    @MaxLength(REVIEWS_LIMITS.CONTENT.MAX)
    @Transform(trim)
    @Field(() => String)
    content!: string;

    @IsDefined()
    @IsInt()
    @Max(REVIEWS_LIMITS.RATING.MAX)
    @Min(REVIEWS_LIMITS.RATING.MIN)
    @Field(() => Int)
    rating!: number;

    @IsDefined()
    @IsUUID()
    @IsString()
    @Field(() => String)
    itemId!: string;
}

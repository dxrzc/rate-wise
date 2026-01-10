import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDefined, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
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
    @Field(() => String, {
        description: `The text content of the review. Minimum length: ${REVIEWS_LIMITS.CONTENT.MIN}, Maximum length: ${REVIEWS_LIMITS.CONTENT.MAX}.`,
    })
    content!: string;

    @IsDefined()
    @IsInt()
    @Max(REVIEWS_LIMITS.RATING.MAX)
    @Min(REVIEWS_LIMITS.RATING.MIN)
    @Field(() => Int, {
        description: `The rating score. Minimum: ${REVIEWS_LIMITS.RATING.MIN}, Maximum: ${REVIEWS_LIMITS.RATING.MAX}.`,
    })
    rating!: number;

    @IsDefined()
    @IsString()
    @Field(() => String, {
        description: 'The unique ID of the item being reviewed.',
    })
    itemId!: string;
}

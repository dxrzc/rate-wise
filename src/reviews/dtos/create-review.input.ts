import { Field, InputType } from '@nestjs/graphql';
import { IsDefined, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { REVIEWS_LIMITS } from '../constants/reviews.constant';

@InputType({
    description: 'Input data required to create a new review for an item.',
})
export class CreateReviewInput {
    @IsDefined()
    @IsString()
    @MinLength(REVIEWS_LIMITS.CONTENT.MIN)
    @MaxLength(REVIEWS_LIMITS.CONTENT.MAX)
    @Field(() => String)
    content!: string;

    @IsDefined()
    @IsNumber({ maxDecimalPlaces: 1 })
    @Max(REVIEWS_LIMITS.RATING.MAX)
    @Min(REVIEWS_LIMITS.RATING.MIN)
    @Field(() => Number)
    rating!: number;

    @IsDefined()
    @IsString()
    @Field(() => String)
    itemId!: string;
}

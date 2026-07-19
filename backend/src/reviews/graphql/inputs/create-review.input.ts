import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDefined, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from 'src/common/utils/trim.util';
import { REVIEWS_RULES } from 'src/reviews/policy/reviews.rules';

@InputType({
    description: 'Input data required to create a new review for an item.',
})
export class CreateReviewInput {
    @IsDefined()
    @IsString()
    @MinLength(REVIEWS_RULES.CONTENT.MIN)
    @MaxLength(REVIEWS_RULES.CONTENT.MAX)
    @Transform(trim)
    @Field(() => String, {
        description: `The text content of the review. Minimum length: ${REVIEWS_RULES.CONTENT.MIN}, Maximum length: ${REVIEWS_RULES.CONTENT.MAX}.`,
    })
    readonly content!: string;

    @IsDefined()
    @IsInt()
    @Max(REVIEWS_RULES.RATING.MAX)
    @Min(REVIEWS_RULES.RATING.MIN)
    @Field(() => Int, {
        description: `The rating score. Minimum: ${REVIEWS_RULES.RATING.MIN}, Maximum: ${REVIEWS_RULES.RATING.MAX}.`,
    })
    readonly rating!: number;

    @IsDefined()
    @IsString()
    @Field(() => String, {
        description: 'The unique ID of the item being reviewed.',
    })
    readonly itemId!: string;
}

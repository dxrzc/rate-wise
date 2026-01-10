import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({
    description: `
        Review model representing a user's review of an item.
    `,
})
export class ReviewModel extends BaseModel {
    @Field(() => String, {
        description: 'The text content of the review.',
    })
    content!: string;

    @Field(() => Int, {
        description: 'The rating score given in the review.',
    })
    rating!: number;

    @Field(() => String, {
        description: 'The ID of the user who created this review.',
    })
    createdBy!: string;

    @Field(() => String, {
        description: 'The ID of the item this review is for.',
    })
    relatedItem!: string;
}

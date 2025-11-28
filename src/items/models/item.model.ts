import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({
    description: `
        Item model representing an item to rate and review.
    `,
})
export class ItemModel extends BaseModel {
    @Field(() => String, {
        description: 'The title of the item.',
    })
    title!: string;

    @Field(() => String, {
        description: 'A detailed description of the item.',
    })
    description!: string;

    @Field(() => String, {
        description: 'The category the item belongs to.',
    })
    category!: string;

    @Field(() => [String], {
        description: 'Tags associated with the item.',
    })
    tags!: string[];

    @Field(() => Float, {
        description: 'The average rating of the item based on all reviews.',
    })
    averageRating!: number;

    @Field(() => ID, {
        description: 'The ID of the user who created this item.',
    })
    createdBy!: string;
}

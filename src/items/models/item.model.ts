import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({
    description: `
        Item model representing an item to rate and review.
    `,
})
export class ItemModel extends BaseModel {
    @Field(() => String)
    title!: string;

    @Field(() => String)
    description!: string;

    @Field(() => String)
    category!: string;

    @Field(() => [String])
    tags!: string[];

    @Field(() => Float)
    averageRating!: number;

    @Field(() => ID)
    createdBy!: string;
}

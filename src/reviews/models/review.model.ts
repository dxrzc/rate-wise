import { Field, Float, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({
    description: `
        Review model representing a user's review of an item.
    `,
})
export class ReviewModel extends BaseModel {
    @Field(() => String)
    content!: string;

    @Field(() => Float)
    rating!: number;

    @Field(() => Number)
    votes!: number;

    @Field(() => String)
    createdBy!: string;

    @Field(() => String)
    relatedItem!: string;
}

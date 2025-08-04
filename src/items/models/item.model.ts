import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';

@ObjectType({ description: 'Item model' })
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

    @Field(() => Int)
    reviewCount!: number;
}

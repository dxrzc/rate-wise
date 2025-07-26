import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export abstract class BaseModel {
    @Field(() => Date)
    createdAt!: Date;

    @Field(() => Date)
    updatedAt!: Date;
}

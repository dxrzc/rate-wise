import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'User model' })
export class UserModel {
    @Field(() => String)
    id!: string;

    @Field(() => String)
    username!: string;

    @Field(() => String)
    email!: string;

    // TODO: enum
    @Field(() => String)
    role!: string;

    @Field(() => Float)
    reputationScore!: number;
}

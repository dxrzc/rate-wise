import { BaseModel } from 'src/common/models/base.model';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'User model' })
export class UserModel extends BaseModel {
    @Field(() => ID)
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

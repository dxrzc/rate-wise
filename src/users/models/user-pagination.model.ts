import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from './user.model';

@ObjectType()
export class UserPagination {
    @Field(() => [UserModel])
    data!: UserModel[];

    @Field(() => String)
    nextCursor!: string;
}

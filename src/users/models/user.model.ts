import { Field, Float, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';
import { UserStatus } from '../enum/user-status.enum';
import { UserRole } from '../enum/user-role.enum';

@ObjectType({ description: 'User model' })
export class UserModel extends BaseModel {
    @Field(() => String)
    username!: string;

    @Field(() => String)
    email!: string;

    @Field(() => UserRole)
    role!: UserRole;

    @Field(() => UserStatus)
    status!: UserStatus;

    @Field(() => Float)
    reputationScore!: number;
}

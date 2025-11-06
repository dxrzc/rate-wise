import { Field, Float, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';
import { AccountStatus } from '../enums/account-status.enum';
import { UserRole } from '../enums/user-role.enum';

@ObjectType({ description: 'User model' })
export class UserModel extends BaseModel {
    @Field(() => String)
    username!: string;

    @Field(() => String)
    email!: string;

    @Field(() => [UserRole])
    roles!: UserRole[];

    @Field(() => AccountStatus)
    status!: AccountStatus;

    @Field(() => Float)
    reputationScore!: number;
}

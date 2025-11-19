import { Field, Float, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/models/base.model';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

@ObjectType()
export class UserAccountModel extends BaseModel {
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

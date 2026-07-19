import { Field, ObjectType } from '@nestjs/graphql';
import { BaseModel } from 'src/common/graphql/base.model';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

@ObjectType({
    description: `
        Account model representing authenticated user details
    `,
})
export class AccountModel extends BaseModel {
    @Field(() => String, {
        description: `
            Unique username chosen by the user
        `,
    })
    username!: string;

    @Field(() => String, {
        description: `
            Email address of the user
        `,
    })
    email!: string;

    @Field(() => [UserRole], {
        description: `
            Roles assigned to the user
        `,
    })
    roles!: UserRole[];

    @Field(() => AccountStatus, {
        description: `
            Current status of the user account
        `,
    })
    status!: AccountStatus;
}

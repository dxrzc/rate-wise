import { UserModel } from './user.model';
import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/common/models/base-pagination.model';

@ObjectType({
    description: `
        Paginated model for UserModel representing a paginated list of users.
    `,
})
export class UserPaginationModel extends Paginated(UserModel) {}

import { UserModel } from './user.model';
import { ObjectType } from '@nestjs/graphql';
import { BasePaginationModel } from 'src/common/models/base-pagination.model';

@ObjectType()
export class UserPaginationModel extends BasePaginationModel(UserModel) {}

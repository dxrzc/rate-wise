import { Field, ObjectType } from '@nestjs/graphql';
import { UserAccountModel } from 'src/auth/models/user-account.model';
import { Item } from 'src/items/entities/item.entity';
import { ItemPaginationModel } from 'src/items/models/pagination.model';

@ObjectType({ description: 'User model' })
export class UserModel extends UserAccountModel {
    @Field(() => ItemPaginationModel)
    items!: Item[];
}

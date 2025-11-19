import { Field, ObjectType } from '@nestjs/graphql';
import { AccountModel } from 'src/auth/models/account.model';
import { Item } from 'src/items/entities/item.entity';
import { ItemPaginationModel } from 'src/items/models/pagination.model';

@ObjectType({ description: 'User model' })
export class UserModel extends AccountModel {
    @Field(() => ItemPaginationModel)
    items!: Item[];
}

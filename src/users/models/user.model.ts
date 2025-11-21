import { Field, ObjectType } from '@nestjs/graphql';
import { AccountModel } from 'src/auth/models/account.model';
import { ItemModel } from 'src/items/models/item.model';
import { ItemPaginationModel } from 'src/items/models/pagination.model';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';

@ObjectType({
    description: `
        User model extending AccountModel to include user-specific details
        such as associated items.
    `,
})
export class UserModel extends AccountModel {
    @Field(() => ItemPaginationModel)
    items!: IPaginatedType<ItemModel>;
}

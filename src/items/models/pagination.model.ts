import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/common/graphql/base-pagination.model';
import { ItemModel } from './item.model';

@ObjectType({
    description: `
        Paginated model for ItemModel representing a paginated list of items.
    `,
})
export class ItemPaginationModel extends Paginated(ItemModel) {}

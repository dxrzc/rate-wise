import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/common/models/base-pagination.model';
import { ItemModel } from './item.model';

@ObjectType()
export class ItemPaginationModel extends Paginated(ItemModel) {}

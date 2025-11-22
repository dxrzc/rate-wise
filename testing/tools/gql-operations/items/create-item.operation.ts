import { CreateItemInput } from 'src/items/dtos/create-item.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { ItemModel } from 'src/items/models/item.model';

export function createItem({ args, fields }: IOperation<CreateItemInput, ItemModel>) {
    return operationFactory(
        {
            operationName: 'createItem',
            argumentName: 'item_data',
            inputType: 'CreateItemInput',
            modelDataFetched: 'item',
        },
        {
            args,
            fields,
        },
    );
}

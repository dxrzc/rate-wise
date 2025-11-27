import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { ItemModel } from 'src/items/models/item.model';

export function findItemById({ args, fields }: IOperation<string, ItemModel>) {
    return operationFactory(
        {
            operationName: 'findItemById',
            argumentName: 'item_id',
            operationType: 'query',
            inputType: 'ID',
            modelDataFetched: 'item',
        },
        {
            args,
            fields,
        },
    );
}

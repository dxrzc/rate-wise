import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function reactivateAccount({ args, fields }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'reactivateAccount',
            argumentName: 'user_id',
            inputType: 'ID',
        },
        {
            args,
            fields,
        },
    );
}

import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function suspendAccount({ args, fields }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'suspendAccount',
            argumentName: 'user_id',
            inputType: 'ID',
        },
        {
            args,
            fields,
        },
    );
}

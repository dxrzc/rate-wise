import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function requestSignOutAll({ args, fields }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'requestSignOutAll',
            argumentName: 'email',
            inputType: 'String',
        },
        {
            args,
            fields,
        },
    );
}

import { RequestSignOutAllInput } from 'src/auth/graphql/inputs/request-sign-out-all.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function requestSignOutAll({ args, fields }: IOperation<RequestSignOutAllInput, void>) {
    return operationFactory(
        {
            operationName: 'requestSignOutAll',
            argumentName: 'input',
            inputType: 'RequestSignOutAllInput',
        },
        {
            args,
            fields,
        },
    );
}

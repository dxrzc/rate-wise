import { ReAuthenticationInput } from 'src/auth/dtos/re-authentication.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function signOutAll({ input, fields }: IOperation<ReAuthenticationInput, void>) {
    return operationFactory(
        {
            operationName: 'signOutAll',
            argumentName: 'credentials',
            inputType: 'ReAuthenticationInput',
        },
        {
            input,
            fields,
        },
    );
}

import { ReAuthenticationInput } from 'src/auth/dtos/re-authentication.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function signOutAll({
    input,
    fields,
}: IOperation<ReAuthenticationInput, void>) {
    return operationFactory(
        {
            operationName: 'signOut',
            argumentName: 'password',
            inputType: 'ReAuthenticationInput',
        },
        {
            input,
            fields,
        },
    );
}

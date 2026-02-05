import { ReAuthenticationInput } from 'src/auth/graphql/inputs/re-authentication.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function signOutAll({ args, fields }: IOperation<ReAuthenticationInput, void>) {
    return operationFactory(
        {
            operationName: 'signOutAll',
            argumentName: 'credentials',
            inputType: 'ReAuthenticationInput',
        },
        {
            args,
            fields,
        },
    );
}

import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { UserModel } from 'src/users/graphql/models/user.model';

export function signUp({ args, fields }: IOperation<SignUpInput, UserModel>) {
    return operationFactory(
        {
            operationName: 'signUp',
            argumentName: 'user_data',
            inputType: 'SignUpInput',
        },
        {
            args,
            fields,
        },
    );
}

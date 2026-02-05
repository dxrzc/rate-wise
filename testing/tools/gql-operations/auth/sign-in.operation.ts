import { SignInInput } from 'src/auth/graphql/inputs/sign-in.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { UserModel } from 'src/users/models/user.model';

export function signIn({ args, fields }: IOperation<SignInInput, UserModel>) {
    return operationFactory(
        {
            operationName: 'signIn',
            argumentName: 'credentials',
            inputType: 'SignInInput',
        },
        {
            args,
            fields,
        },
    );
}

import { operationFactory } from '../factory/users.operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
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

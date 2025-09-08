import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { UserModel } from 'src/users/models/user.model';

export function signIn({ input, fields }: IOperation<SignInInput, UserModel>) {
    return operationFactory(
        {
            operationName: 'signIn',
            argumentName: 'credentials',
            inputType: 'SignInInput',
        },
        {
            input,
            fields,
        },
    );
}

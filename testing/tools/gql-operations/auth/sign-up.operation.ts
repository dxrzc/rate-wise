import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { UserModel } from 'src/users/models/user.model';

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

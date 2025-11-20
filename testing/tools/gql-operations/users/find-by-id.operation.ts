import { UserModel } from 'src/users/models/user.model';
import { operationFactory } from '../factory/users.operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function findUserById({ args, fields }: IOperation<string, UserModel>) {
    return operationFactory(
        {
            operationName: 'findUserById',
            argumentName: 'user_id',
            operationType: 'query',
            inputType: 'ID',
        },
        {
            args,
            fields,
        },
    );
}

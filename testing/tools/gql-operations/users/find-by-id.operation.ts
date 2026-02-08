import { UserModel } from 'src/users/graphql/models/user.model';
import { operationFactory } from '../factory/operation.factory';
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

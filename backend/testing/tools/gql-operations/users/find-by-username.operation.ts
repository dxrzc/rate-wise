import { UserModel } from 'src/users/graphql/models/user.model';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function findUserByUsername({ args, fields }: IOperation<string, UserModel>) {
    return operationFactory(
        {
            operationName: 'findUserByUsername',
            argumentName: 'username',
            operationType: 'query',
            inputType: 'String',
            modelDataFetched: 'account',
        },
        {
            args,
            fields,
        },
    );
}

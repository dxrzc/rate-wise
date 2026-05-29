import { UserModel } from 'src/users/graphql/models/user.model';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function me({ fields }: Omit<IOperation<string, UserModel>, 'args'>) {
    return operationFactory(
        {
            operationName: 'me',
            operationType: 'query',
            modelDataFetched: 'account',
        },
        {
            args: undefined,
            fields,
        },
    );
}

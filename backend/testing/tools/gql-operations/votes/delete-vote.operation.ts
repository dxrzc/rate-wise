import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function deleteVote({ args }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'deleteVote',
            argumentName: 'reviewId',
            inputType: 'String',
            operationType: 'mutation',
        },
        {
            args,
        },
    );
}

import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function voteReview({ args, fields }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'voteReview',
            argumentName: 'review_id',
            inputType: 'ID',
        },
        {
            args,
            fields,
        },
    );
}

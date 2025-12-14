import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function voteReview({ args, fields }: IOperation<{ vote: string; reviewId: string }, void>) {
    return operationFactory(
        {
            operationName: 'voteReview',
            argumentName: 'vote_data',
            inputType: 'CreateVoteInput',
        },
        {
            args,
            fields,
        },
    );
}

export function deleteVote({ args }: IOperation<string, void>) {
    return operationFactory(
        {
            operationName: 'deleteVote',
            argumentName: 'reviewId',
            inputType: 'String',
        },
        {
            args,
        },
    );
}

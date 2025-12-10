import { CreateVoteInput } from 'src/votes/dtos/create-vote.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';

export function voteReview({ args, fields }: IOperation<CreateVoteInput, void>) {
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

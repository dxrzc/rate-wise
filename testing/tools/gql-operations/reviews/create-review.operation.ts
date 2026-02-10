import { CreateReviewInput } from 'src/reviews/graphql/inputs/create-review.input';
import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { ReviewModel } from 'src/reviews/graphql/models/review.model';

export function createReview({ args, fields }: IOperation<CreateReviewInput, ReviewModel>) {
    return operationFactory(
        {
            operationName: 'createReview',
            argumentName: 'review_data',
            inputType: 'CreateReviewInput',
            modelDataFetched: 'review',
        },
        {
            args,
            fields,
        },
    );
}

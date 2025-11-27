import { operationFactory } from '../factory/operation.factory';
import { IOperation } from '../interfaces/operation.interface';
import { ReviewModel } from 'src/reviews/models/review.model';
import { CreateReviewInput } from 'src/reviews/dtos/create-review.input';

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

import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/common/models/base-pagination.model';
import { ReviewModel } from './review.model';

@ObjectType({
    description: `
        Paginated model for ReviewModel representing a paginated list of reviews.
    `,
})
export class ReviewPaginationModel extends Paginated(ReviewModel) {}

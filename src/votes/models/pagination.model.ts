import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/common/models/base-pagination.model';
import { VoteModel } from './vote.model';

@ObjectType({
    description: `
        Paginated model for VoteModel representing a paginated list of votes.
    `,
})
export class VotePaginationModel extends Paginated(VoteModel) {}

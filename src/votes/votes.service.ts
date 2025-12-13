import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { Vote } from './entities/vote.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { VoteAction } from './enum/vote.enum';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { ReviewService } from 'src/reviews/reviews.service';
import { ReviewVotesArgs } from './dtos/args/review-votes.args';
import { PaginationService } from 'src/pagination/pagination.service';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';

@Injectable()
export class VotesService {
    constructor(
        private readonly paginationService: PaginationService<Vote>,
        @InjectRepository(Vote)
        private readonly voteRepository: Repository<Vote>,
        private readonly loggerService: HttpLoggerService,
        private readonly reviewService: ReviewService,
        private readonly dataSource: DataSource,
    ) {}

    private async upVoteReview(reviewId: string, user: AuthenticatedUser): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            await manager.withRepository(this.voteRepository).save({
                vote: VoteAction.UP,
                createdBy: user.id,
                relatedReview: reviewId,
            });
            await this.reviewService.addVote(reviewId, VoteAction.UP, manager);
        });
        this.loggerService.info(`User ${user.id} upvoted review ${reviewId}`);
    }

    private async downVoteReview(reviewId: string, user: AuthenticatedUser): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            await manager.withRepository(this.voteRepository).save({
                vote: VoteAction.DOWN,
                createdBy: user.id,
                relatedReview: reviewId,
            });
            await this.reviewService.addVote(reviewId, VoteAction.DOWN, manager);
        });
        this.loggerService.info(`User ${user.id} downvoted review ${reviewId}`);
    }

    private async findUserVoteInReview(userId: string, reviewId: string): Promise<Vote | null> {
        const userVote = await this.voteRepository.findOne({
            where: { relatedReview: reviewId, createdBy: userId },
        });
        return userVote;
    }

    async voteReview(reviewId: string, user: AuthenticatedUser, action: VoteAction): Promise<void> {
        await this.reviewService.existsOrThrow(reviewId);
        const previousVote = await this.findUserVoteInReview(user.id, reviewId);
        if (previousVote) {
            if (previousVote.vote === action) return;
            await this.voteRepository.delete({ id: previousVote.id });
        }
        if (action === VoteAction.UP) await this.upVoteReview(reviewId, user);
        else await this.downVoteReview(reviewId, user);
    }

    async findAllVotesForReview(args: ReviewVotesArgs): Promise<IPaginatedType<Vote>> {
        await this.reviewService.existsOrThrow(args.reviewId);
        const sqbAlias = 'vote';
        return await this.paginationService.create({
            limit: args.limit,
            cursor: args.cursor,
            cache: true,
            queryBuilder: {
                sqbModifier: (qb) =>
                    qb.where(`${sqbAlias}.review_id = :reviewId`, { reviewId: args.reviewId }),
                sqbAlias,
            },
        });
    }
}

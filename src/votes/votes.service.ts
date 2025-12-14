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

    private async findUserVoteInReview(userId: string, reviewId: string): Promise<Vote | null> {
        const userVote = await this.voteRepository.findOne({
            where: { relatedReview: reviewId, createdBy: userId },
        });
        return userVote;
    }

    async voteReview(reviewId: string, user: AuthenticatedUser, action: VoteAction): Promise<void> {
        await this.reviewService.existsOrThrow(reviewId);
        const previousVote = await this.findUserVoteInReview(user.id, reviewId);
        await this.dataSource.transaction(async (manager: EntityManager) => {
            if (previousVote) {
                if (previousVote.vote === action) return;
                // delete old vote
                const deleteResult = await manager
                    .withRepository(this.voteRepository)
                    .delete({ id: previousVote.id });
                if (deleteResult.affected && deleteResult.affected > 0) {
                    await this.reviewService.deleteVoteTx(reviewId, previousVote.vote, manager);
                }
            }
            // add vote
            await manager.withRepository(this.voteRepository).save({
                vote: action,
                createdBy: user.id,
                relatedReview: reviewId,
            });
            await this.reviewService.addVoteTx(reviewId, action, manager);
        });
        this.loggerService.info(`User ${user.id} ${action}voted review ${reviewId}`);
    }

    async deleteVote(reviewId: string, user: AuthenticatedUser): Promise<boolean> {
        await this.reviewService.existsOrThrow(reviewId);
        const previousVote = await this.findUserVoteInReview(user.id, reviewId);

        if (!previousVote) {
            return false;
        }

        await this.dataSource.transaction(async (manager: EntityManager) => {
            const deleteResult = await manager
                .withRepository(this.voteRepository)
                .delete({ id: previousVote.id });
            if (deleteResult.affected && deleteResult.affected > 0) {
                await this.reviewService.deleteVoteTx(reviewId, previousVote.vote, manager);
            }
        });

        this.loggerService.info(`User ${user.id} removed vote from review ${reviewId}`);
        return true;
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

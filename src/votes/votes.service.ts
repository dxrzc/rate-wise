import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { User } from 'src/users/entities/user.entity';
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
        @Inject(forwardRef(() => ReviewService))
        private readonly reviewService: ReviewService,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * All the transactions by the same user will happen sequentially.
     * This prevents race conditions if a user votes/downvotes/delete-votes multiple times in a short period.
     */
    private async lockUserTx(userId: string, manager: EntityManager) {
        // similar to std::lock_guard in C++
        await manager
            .getRepository(User)
            .createQueryBuilder('user')
            .setLock('pessimistic_write')
            .where('user.id = :id', { id: userId })
            .getOne();
    }

    private async deleteVoteAndUpdateReviewTx(
        vote: Vote,
        reviewId: string,
        manager: EntityManager,
    ) {
        await manager.withRepository(this.voteRepository).delete({ id: vote.id });
        await this.reviewService.deleteVoteTx(reviewId, vote.vote, manager);
    }

    async voteReview(reviewId: string, user: AuthenticatedUser, action: VoteAction): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            await this.reviewService.existsOrThrowTx(reviewId, manager);
            await this.lockUserTx(user.id, manager); // one at a time per user
            const previousVote = await manager.withRepository(this.voteRepository).findOne({
                where: { relatedReview: reviewId, createdBy: user.id },
            });
            if (previousVote) {
                if (previousVote.vote === action) return;
                await this.deleteVoteAndUpdateReviewTx(previousVote, reviewId, manager);
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
        let deleted = false;
        await this.dataSource.transaction(async (manager: EntityManager) => {
            await this.lockUserTx(user.id, manager); // one at a time per user
            const previousVote = await manager.withRepository(this.voteRepository).findOne({
                where: { relatedReview: reviewId, createdBy: user.id },
            });
            if (!previousVote) return;
            await this.deleteVoteAndUpdateReviewTx(previousVote, reviewId, manager);
            deleted = true;
        });
        if (deleted) {
            this.loggerService.info(`User ${user.id} removed vote from review ${reviewId}`);
        }
        return deleted;
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
                    qb.where(`${sqbAlias}.relatedReview = :reviewId`, { reviewId: args.reviewId }),
                sqbAlias,
            },
        });
    }

    async subtractUserVotesFromReviews(userId: string, manager: EntityManager): Promise<void> {
        const [upVotes, downVotes] = await Promise.all([
            manager.withRepository(this.voteRepository).find({
                where: { createdBy: userId, vote: VoteAction.UP },
                select: ['relatedReview', 'vote'],
            }),
            manager.withRepository(this.voteRepository).find({
                where: { createdBy: userId, vote: VoteAction.DOWN },
                select: ['relatedReview', 'vote'],
            }),
        ]);
        await this.reviewService.deleteVoteInMultipleReviews(
            upVotes.map((v) => v.relatedReview),
            VoteAction.UP,
            manager,
        );
        await this.reviewService.deleteVoteInMultipleReviews(
            downVotes.map((v) => v.relatedReview),
            VoteAction.DOWN,
            manager,
        );
    }
}

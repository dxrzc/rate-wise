import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { Vote } from './entities/vote.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { VoteAction } from './enum/vote.enum';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { ReviewService } from 'src/reviews/reviews.service';
import { ReviewVotesArgs } from './graphql/args/review-votes.args';
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

    /**
     * Creates an Advisory Lock for user-review.
     * Reference: https://www.postgresql.org/docs/9.1/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
     * @returns boolean indicating whether the lock was acquired or not.
     */
    async acquireVoteLock({
        txManager,
        userId,
        reviewId,
    }: {
        txManager: EntityManager;
        userId: string;
        reviewId: string;
    }): Promise<boolean> {
        const lockQuery = `SELECT pg_try_advisory_xact_lock(hashtext($1)) AS acquired`;
        const lockKey = `${userId}-${reviewId}`;
        const [lockResult] = await txManager.query<{ acquired: boolean }[]>(lockQuery, [lockKey]);
        return lockResult.acquired;
    }

    private async deleteVoteAndUpdateReviewTx(
        vote: Vote,
        reviewId: string,
        txManager: EntityManager,
    ) {
        await txManager.withRepository(this.voteRepository).delete({ id: vote.id });
        await this.reviewService.decrementVotesTx({
            reviewId,
            action: vote.action,
            txManager,
            value: 1,
        });
    }

    async voteReview(reviewId: string, user: AuthenticatedUser, action: VoteAction): Promise<void> {
        await this.dataSource.transaction(async (txManager: EntityManager) => {
            await this.reviewService.existsOrThrowTx(reviewId, txManager);
            const acquired = await this.acquireVoteLock({
                txManager,
                userId: user.id,
                reviewId,
            });
            if (!acquired) return;
            const previousVote = await txManager.withRepository(this.voteRepository).findOne({
                where: { relatedReview: reviewId, createdBy: user.id },
            });
            if (previousVote) {
                if (previousVote.action === action) return;
                await this.deleteVoteAndUpdateReviewTx(previousVote, reviewId, txManager);
            }
            // add vote
            await txManager.withRepository(this.voteRepository).save({
                action,
                createdBy: user.id,
                relatedReview: reviewId,
            });
            await this.reviewService.incrementVotesTx({
                reviewId,
                action,
                txManager,
                value: 1,
            });
        });
        this.loggerService.info(`User ${user.id} ${action}voted review ${reviewId}`);
    }

    async deleteVote(reviewId: string, user: AuthenticatedUser): Promise<boolean> {
        await this.reviewService.existsOrThrow(reviewId);
        let deleted = false;
        await this.dataSource.transaction(async (txManager: EntityManager) => {
            const acquired = await this.acquireVoteLock({
                txManager,
                userId: user.id,
                reviewId,
            });
            if (!acquired) return;
            const previousVote = await txManager.withRepository(this.voteRepository).findOne({
                where: { relatedReview: reviewId, createdBy: user.id },
            });
            if (!previousVote) return;
            await this.deleteVoteAndUpdateReviewTx(previousVote, reviewId, txManager);
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

    async revokeUserVotesOnReviewsTx(userId: string, txManager: EntityManager): Promise<void> {
        const votes = await txManager.withRepository(this.voteRepository).find({
            where: { createdBy: userId },
            select: ['relatedReview', 'action'],
        });
        const upVotes = votes.filter((v) => v.action === VoteAction.UP);
        const downVotes = votes.filter((v) => v.action === VoteAction.DOWN);
        await this.reviewService.decrementVotesInTx({
            reviewsIds: upVotes.map((v) => v.relatedReview),
            action: VoteAction.UP,
            txManager,
        });
        await this.reviewService.decrementVotesInTx({
            reviewsIds: downVotes.map((v) => v.relatedReview),
            action: VoteAction.DOWN,
            txManager,
        });
    }
}

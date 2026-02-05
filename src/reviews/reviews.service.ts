import { Injectable } from '@nestjs/common';
import { CreateReviewInput } from './dtos/create-review.input';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { EntityManager, In, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemsService } from 'src/items/items.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { PaginationService } from 'src/pagination/pagination.service';
import { UsersService } from 'src/users/users.service';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { REVIEW_MESSAGES } from './messages/reviews.messages';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { isDuplicatedKeyError } from 'src/common/errors/is-duplicated-key-error';
import { ReviewFiltersArgs } from './dtos/args/review-filters.args';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemLogger } from 'src/common/logging/system.logger';
import { getDuplicatedErrorKeyDetails } from 'src/common/errors/get-duplicated-key-error-details';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        private readonly paginationService: PaginationService<Review>,
        private readonly itemsService: ItemsService,
        private readonly usersService: UsersService,
        private readonly logger: HttpLoggerService,
    ) {}

    private handleNonExistentReview(reviewId: string) {
        this.logger.error(`Review with id ${reviewId} not found`);
        throw GqlHttpError.NotFound(REVIEW_MESSAGES.NOT_FOUND);
    }

    private verifyUUidOrThrow(id: string) {
        if (!validUUID(id)) {
            this.logger.error('Invalid UUID');
            throw GqlHttpError.NotFound(REVIEW_MESSAGES.NOT_FOUND);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async refreshReviewVotes() {
        await this.reviewRepository.query(`
            WITH actual AS (
                SELECT
                  r.id AS review_id,
                  COUNT(v.id) FILTER (WHERE v.vote = 'up')   AS up,
                  COUNT(v.id) FILTER (WHERE v.vote = 'down') AS down
                FROM review r
                LEFT JOIN vote v ON v.review_id = r.id
                GROUP BY r.id
            )
            UPDATE review r
            SET
              upvotes = a.up,
              downvotes = a.down
            FROM actual a
            WHERE r.id = a.review_id
              AND (r.upvotes != a.up OR r.downvotes != a.down);
        `);
        SystemLogger.getInstance().log('Review votes refreshed via cron job');
    }

    async existsOrThrow(reviewId: string): Promise<void> | never {
        this.verifyUUidOrThrow(reviewId);
        const count = await this.reviewRepository.countBy({ id: reviewId });
        if (count === 0) {
            this.handleNonExistentReview(reviewId);
        }
    }

    async existsOrThrowTx(reviewId: string, manager: EntityManager): Promise<void> | never {
        this.verifyUUidOrThrow(reviewId);
        const count = await manager.withRepository(this.reviewRepository).countBy({ id: reviewId });
        if (count === 0) {
            this.handleNonExistentReview(reviewId);
        }
    }

    async findOneByIdOrThrow(reviewId: string): Promise<Review> {
        await this.existsOrThrow(reviewId);
        const review = await this.reviewRepository.findOneBy({ id: reviewId });
        return review!;
    }

    async createOne(reviewData: CreateReviewInput, user: AuthenticatedUser) {
        const item = await this.itemsService.findOneByIdOrThrow(reviewData.itemId);
        if (item.createdBy === user.id) {
            this.logger.error(`User ${user.id} attempted to review their own item ${item.id}`);
            throw GqlHttpError.Forbidden(REVIEW_MESSAGES.CANNOT_REVIEW_OWN_ITEM);
        }
        try {
            const review = await this.reviewRepository.save({
                ...reviewData,
                relatedItem: item.id,
                createdBy: user.id,
            });
            this.logger.info(`Created review for item ${item.id} by user ${user.id}`);
            return review;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetails(error));
                throw GqlHttpError.Conflict(REVIEW_MESSAGES.ALREADY_REVIEWED);
            }
            throw error;
        }
    }

    async filterReviews(filters: ReviewFiltersArgs) {
        if (filters.createdBy) await this.usersService.findOneByIdOrThrow(filters.createdBy);
        if (filters.relatedItem) await this.itemsService.findOneByIdOrThrow(filters.relatedItem);
        const sqbAlias = 'review';
        return await this.paginationService.create({
            cursor: filters.cursor,
            limit: filters.limit,
            cache: true,
            queryBuilder: {
                sqbModifier: (qb) => {
                    if (filters.createdBy) {
                        qb.andWhere(`${sqbAlias}.createdBy = :createdBy`, {
                            createdBy: filters.createdBy,
                        });
                    }
                    if (filters.relatedItem) {
                        qb.andWhere(`${sqbAlias}.relatedItem = :relatedItem`, {
                            relatedItem: filters.relatedItem,
                        });
                    }
                    return qb;
                },
                sqbAlias,
            },
        });
    }

    async addVoteTx(reviewId: string, vote: VoteAction, manager: EntityManager): Promise<void> {
        const propPath = vote === VoteAction.UP ? 'upVotes' : 'downVotes';
        await manager
            .withRepository(this.reviewRepository)
            .increment({ id: reviewId }, propPath, 1);
    }

    async deleteVoteTx(reviewId: string, vote: VoteAction, manager: EntityManager): Promise<void> {
        const propPath = vote === VoteAction.UP ? 'upVotes' : 'downVotes';
        await manager
            .withRepository(this.reviewRepository)
            .decrement({ id: reviewId }, propPath, 1);
    }

    async deleteVoteInMultipleReviews(
        reviewsIds: string[],
        vote: VoteAction,
        manager: EntityManager,
    ): Promise<void> {
        if (reviewsIds.length === 0) return;
        const propPath = vote === VoteAction.UP ? 'upVotes' : 'downVotes';
        await manager
            .withRepository(this.reviewRepository)
            .decrement({ id: In(reviewsIds) }, propPath, 1);
    }

    async calculateItemAverageRating(itemId: string): Promise<number> {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'average')
            .where('review.relatedItem = :itemId', { itemId })
            .getRawOne<{ average: string | null }>();
        const avg = result?.average;
        return avg ? Math.round(Number(avg) * 10) / 10 : 0;
    }
}

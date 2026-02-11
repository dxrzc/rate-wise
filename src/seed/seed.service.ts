import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserDataGenerator } from './generators/user-data.generator';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { Item } from 'src/items/entities/item.entity';
import { ItemDataGenerator } from './generators/item-data.generator';
import { Review } from 'src/reviews/entities/review.entity';
import { ReviewDataGenerator } from './generators/review-data.generator';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { AdminConfigService } from 'src/config/services/admin.config.service';
import { Vote } from 'src/votes/entities/vote.entity';
import { ReviewService } from 'src/reviews/reviews.service';
import { SEED_RULES } from './policy/seed.rules';
import { ISeedOptions } from './interfaces/seed-options.interface';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(Vote)
        private readonly voteRepository: Repository<Vote>,
        private readonly usersSeed: UserDataGenerator,
        private readonly itemsSeed: ItemDataGenerator,
        private readonly reviewsSeed: ReviewDataGenerator,
        private readonly logger: HttpLoggerService,
        private readonly adminConfigService: AdminConfigService,
        private readonly reviewService: ReviewService,
    ) {}

    private async getUserIdsOrThrow(): Promise<string[]> {
        const selectedUserIds = await this.userRepository.find({
            select: { id: true },
            where: { email: Not(this.adminConfigService.email) },
        });
        if (selectedUserIds.length === 0) {
            throw new Error('No users found. Seed users first');
        }
        return selectedUserIds.map((e) => e.id);
    }

    private async getItemsMetaOrThrow(): Promise<{ id: string; createdBy: string }[]> {
        const items = await this.itemRepository.find({
            select: { id: true, createdBy: true },
        });
        if (items.length === 0) {
            throw new Error('No items found. Seed items first');
        }
        return items;
    }

    private async getReviewsIdsOrThrow(): Promise<string[]> {
        const selectedReviewsIds = await this.reviewRepository.find({ select: { id: true } });
        if (selectedReviewsIds.length === 0) {
            throw new Error('No reviews found. Seed reviews first');
        }
        return selectedReviewsIds.map((e) => e.id);
    }

    private async cleanDb(): Promise<void> {
        await this.userRepository.delete({
            email: Not(this.adminConfigService.email),
        }); // deletes on cascade all related entities
        this.logger.debug('Database cleaned');
    }

    async runSeed(options: ISeedOptions = SEED_RULES): Promise<void> {
        await this.cleanDb();
        await this.createUsers(options.USERS);
        await this.createItems(options.ITEMS_PER_USER);
        await this.createReviews(options.MAX_REVIEWS);
        await this.createVotes(options.MAX_VOTES);
        this.logger.debug('Database seeding completed');
    }

    private async createUsers(entries: number): Promise<void> {
        let count = 0;
        for (let i = 0; i < entries; i++) {
            const user = this.userRepository.create({ ...this.usersSeed.user });
            await this.userRepository.save(user);
            count++;
        }
        this.logger.debug(`${count} users seeded`);
    }

    private async createItems(itemsPerUser: number): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        let count = 0;
        for (const userId of usersIds) {
            for (let i = 0; i < itemsPerUser; i++) {
                const item = this.itemRepository.create({
                    ...this.itemsSeed.item,
                    createdBy: userId,
                });
                await this.itemRepository.save(item);
                count++;
            }
        }
        this.logger.debug(`${count} items seeded`);
    }

    /**
     * Create a hard max number of reviews globally
     */
    private async createReviews(maxReviews: number): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const itemsMeta = await this.getItemsMetaOrThrow();
        const candidates: Array<{ itemId: string; userId: string }> = [];
        for (const { id: itemId, createdBy } of itemsMeta) {
            for (const userId of usersIds) {
                if (userId !== createdBy) {
                    candidates.push({ itemId, userId });
                }
            }
        }
        const selected = candidates.sort(() => Math.random() - 0.5).slice(0, maxReviews);
        let count = 0;
        for (const { itemId, userId } of selected) {
            const review = this.reviewRepository.create({
                ...this.reviewsSeed.review,
                relatedItem: itemId,
                createdBy: userId,
            });
            await this.reviewRepository.save(review);
            count++;
        }
        this.logger.debug(`${count} reviews seeded`);
    }

    /**
     * Create a hard max number of votes globally
     */
    private async createVotes(maxVotes: number): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const reviewsIds = await this.getReviewsIdsOrThrow();
        const candidates: Array<{ reviewId: string; userId: string }> = [];
        for (const reviewId of reviewsIds) {
            for (const userId of usersIds) {
                candidates.push({ reviewId, userId });
            }
        }
        const selected = candidates.sort(() => Math.random() - 0.5).slice(0, maxVotes);
        let count = 0;
        for (const { reviewId, userId } of selected) {
            const vote = this.voteRepository.create({
                relatedReview: reviewId,
                createdBy: userId,
                vote: Math.random() < 0.5 ? VoteAction.UP : VoteAction.DOWN,
            });
            await this.voteRepository.save(vote);
            count++;
        }
        this.logger.debug(`${count} votes seeded`);
        await this.reviewService.refreshReviewVotes();
    }
}

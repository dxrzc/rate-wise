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

    async runSeed(): Promise<void> {
        await this.cleanDb();
        await this.createUsers(SEED_RULES.USERS);
        await this.createItems(SEED_RULES.ITEMS_PER_USER);
        await this.createReviews();
        await this.createVotes();
        this.logger.debug('Database seeding completed');
    }

    private async createUsers(entries: number): Promise<void> {
        const users = Array.from({ length: entries }, () =>
            this.userRepository.create({ ...this.usersSeed.user }),
        );
        await this.userRepository.insert(users);
        this.logger.debug(`${entries} users seeded`);
    }

    private async createItems(itemsPerUser: number): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const items = new Array<Item>();
        for (const id of usersIds) {
            for (let i = 0; i < itemsPerUser; i++)
                items.push(this.itemRepository.create({ ...this.itemsSeed.item, createdBy: id }));
        }
        const { identifiers } = await this.itemRepository.insert(items);
        this.logger.debug(`${identifiers.length} items seeded`);
    }

    /**
     * Each item receives a limited number of random reviews
     */
    private async createReviews(): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const itemsMeta = await this.getItemsMetaOrThrow();
        const reviews = new Array<Review>();
        for (const { id: itemId, createdBy } of itemsMeta) {
            const eligibleUsers = usersIds.filter((u) => u !== createdBy);
            const reviewers = eligibleUsers
                .sort(() => 0.5 - Math.random())
                .slice(0, SEED_RULES.MAX_REVIEWS_PER_ITEM);
            for (const userId of reviewers) {
                reviews.push(
                    this.reviewRepository.create({
                        ...this.reviewsSeed.review,
                        relatedItem: itemId,
                        createdBy: userId,
                    }),
                );
            }
        }
        const { identifiers } = await this.reviewRepository.insert(reviews);
        this.logger.debug(`${identifiers.length} reviews seeded`);
    }

    /**
     * Each review receives a limited number of random votes
     */
    private async createVotes(): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const reviewsIds = await this.getReviewsIdsOrThrow();
        const votes = new Array<Vote>();
        for (const reviewId of reviewsIds) {
            const voters = usersIds
                .sort(() => 0.5 - Math.random())
                .slice(0, SEED_RULES.MAX_VOTES_PER_REVIEW);
            for (const userId of voters) {
                votes.push(
                    this.voteRepository.create({
                        relatedReview: reviewId,
                        createdBy: userId,
                        vote: Math.random() < 0.5 ? VoteAction.UP : VoteAction.DOWN,
                    }),
                );
            }
        }
        const { identifiers } = await this.voteRepository.insert(votes);
        this.logger.debug(`${identifiers.length} votes seeded`);
        await this.reviewService.refreshReviewVotes();
    }
}

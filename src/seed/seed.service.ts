import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { getRandomUserRoles } from './functions/get-random-user-roles';
import { getRandomAccountStatus } from './functions/get-random-account-status';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from './services/items-seed.service';
import { Review } from 'src/reviews/entities/review.entity';
import { ReviewSeedService } from './services/reviews-seed.service';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { SeedArgs } from './dtos/args/seed.args';
import { AdminConfigService } from 'src/config/services/admin.config.service';
import { Vote } from 'src/votes/entities/vote.entity';
import { ReviewService } from 'src/reviews/reviews.service';

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
        private readonly usersSeed: UserSeedService,
        private readonly itemsSeed: ItemsSeedService,
        private readonly reviewsSeed: ReviewSeedService,
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

    async runSeed(seedArgs: SeedArgs): Promise<void> {
        await this.cleanDb();
        await this.createUsers(seedArgs.users);
        await this.createItems(seedArgs.itemsPerUser);
        await this.createReviews();
        await this.createVotes();
        this.logger.debug('Database seeding completed');
    }

    private async createUsers(entries: number): Promise<void> {
        const users = Array.from({ length: entries }, () =>
            this.userRepository.create({
                ...this.usersSeed.user,
                roles: getRandomUserRoles(),
                status: getRandomAccountStatus(),
            }),
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

    // Every user reviews every item but their own
    async createReviews() {
        const usersIds = await this.getUserIdsOrThrow();
        const itemsMeta = await this.getItemsMetaOrThrow();
        const reviews = new Array<Review>();
        for (let i = 0; i < itemsMeta.length; i++) {
            for (const userId of usersIds) {
                const { id: itemId, createdBy } = itemsMeta[i];
                if (createdBy === userId) continue;
                const review = this.reviewRepository.create({
                    ...this.reviewsSeed.review,
                    relatedItem: itemId,
                    createdBy: userId,
                });
                reviews.push(review);
            }
        }
        const { identifiers } = await this.reviewRepository.insert(reviews);
        this.logger.debug(`${identifiers.length} reviews seeded`);
    }

    // Every user upvotes every review (and their own)
    async createVotes() {
        const usersIds = await this.getUserIdsOrThrow();
        const reviewsIds = await this.getReviewsIdsOrThrow();
        const votes = new Array<Vote>();
        for (const reviewId of reviewsIds) {
            for (const userId of usersIds) {
                const randomVote = Math.random() < 0.5 ? VoteAction.UP : VoteAction.DOWN;
                const voteEntity = this.voteRepository.create({
                    relatedReview: reviewId,
                    createdBy: userId,
                    vote: randomVote,
                });
                votes.push(voteEntity);
            }
        }
        const { identifiers } = await this.voteRepository.insert(votes);
        this.logger.debug(`${identifiers.length} votes seeded`);
        await this.reviewService.refreshReviewVotes();
    }
}

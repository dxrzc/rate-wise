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
import { Vote } from 'src/votes/entities/vote.entity';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { SeedInput } from './dtos/seed.input';
import { AdminConfigService } from 'src/config/services/admin.config.service';

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

    private async getItemsIdsOrThrow(): Promise<string[]> {
        const selectedItemsIds = await this.itemRepository.find({ select: { id: true } });
        if (selectedItemsIds.length === 0) {
            throw new Error('No items found. Seed items first');
        }
        return selectedItemsIds.map((e) => e.id);
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

    async runSeed(seedOptions: SeedInput): Promise<void> {
        await this.cleanDb();
        await this.createUsers(seedOptions.users);
        await this.createItems(seedOptions.itemsPerUser);
        await this.createReviews();
        await this.createVotes();
        this.logger.debug('Database seeding completed');
    }

    private async createUsers(entries: number): Promise<void> {
        await Promise.all(
            Array.from({ length: entries }, async () => {
                return await this.userRepository.save({
                    ...this.usersSeed.user,
                    roles: getRandomUserRoles(),
                    status: getRandomAccountStatus(),
                });
            }),
        );
        this.logger.debug(`${entries} users seeded`);
    }

    private async createItems(itemsPerUser: number): Promise<void> {
        const usersIds = await this.getUserIdsOrThrow();
        const promises = new Array<Promise<Item>>();
        for (const id of usersIds) {
            for (let i = 0; i < itemsPerUser; i++)
                promises.push(this.itemRepository.save({ ...this.itemsSeed.item, createdBy: id }));
        }
        await Promise.all(promises);
        this.logger.debug(`${itemsPerUser} items per user seeded`);
    }

    // Every user reviews every item but their own
    async createReviews() {
        const usersIds = await this.getUserIdsOrThrow();
        const itemsIds = await this.getItemsIdsOrThrow();
        const promises = new Array<Promise<Review>>();
        for (const itemId of itemsIds) {
            for (const userId of usersIds) {
                const item = await this.itemRepository.findOneBy({ id: itemId });
                if (item!.createdBy === userId) continue;
                promises.push(
                    this.reviewRepository.save({
                        ...this.reviewsSeed.review,
                        relatedItem: itemId,
                        createdBy: userId,
                    }),
                );
            }
        }
        const { length } = await Promise.all(promises);
        this.logger.debug(`${length} reviews seeded`);
    }

    // Every user upvotes every review (and their own)
    async createVotes() {
        const usersIds = await this.getUserIdsOrThrow();
        const reviewsIds = await this.getReviewsIdsOrThrow();
        const promises = new Array<Promise<Vote>>();
        for (const reviewId of reviewsIds) {
            for (const userId of usersIds) {
                const randomVote = Math.random() < 0.5 ? VoteAction.UP : VoteAction.DOWN;
                promises.push(
                    this.voteRepository.save({
                        relatedReview: reviewId,
                        createdBy: userId,
                        vote: randomVote,
                    }),
                );
            }
        }
        const { length } = await Promise.all(promises);
        this.logger.debug(`${length} votes seeded`);
    }
}

import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { getRandomUserRoles } from './functions/get-random-user-roles';
import { getRandomAccountStatus } from './functions/get-random-account-status';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from './services/items-seed.service';
import { Review } from 'src/reviews/entities/review.entity';
import { ReviewSeedService } from './services/reviews-seed.service';
import { Vote } from 'src/votes/entities/vote.entity';
import { VoteAction } from 'src/votes/enum/vote.enum';

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
        private readonly dataSource: DataSource,
        private readonly usersSeed: UserSeedService,
        private readonly itemsSeed: ItemsSeedService,
        private readonly reviewsSeed: ReviewSeedService,
        private readonly logger: HttpLoggerService,
    ) {}

    async createUsers(n: number, opts?: { deleteExisting: boolean }): Promise<User[]> {
        // delete existing (if stated) users first
        if (opts?.deleteExisting) await this.userRepository.deleteAll();
        const data = new Array<SignInInput>();
        for (let i = 0; i < n; i++) {
            data.push(this.usersSeed.user);
        }
        const promises = data.map((user) =>
            this.userRepository.save({
                ...user,
                roles: getRandomUserRoles(),
                status: getRandomAccountStatus(),
            }),
        );
        const users = await Promise.all(promises);
        this.logger.debug(`${n} users seeded`);
        return users;
    }

    // item per user
    async createItems(itemsPerUser: number, opts?: { deleteExisting: boolean }): Promise<Item[]> {
        // delete existing (if stated) items first
        if (opts?.deleteExisting) await this.itemRepository.deleteAll();
        const results = await this.userRepository.find({ select: { id: true } });
        if (results.length === 0) throw new Error('No users found. Seed users first');
        const usersIds = results.map((e) => e.id);
        const promises = new Array<Promise<Item>>();
        for (const id of usersIds) {
            for (let i = 0; i < itemsPerUser; i++)
                promises.push(this.itemRepository.save({ ...this.itemsSeed.item, createdBy: id }));
        }
        const items = await Promise.all(promises);
        this.logger.debug(`${itemsPerUser} items per user seeded`);
        return items;
    }

    // reviews per item, user id chosen randomly
    async createReviews(
        reviewsPerItem: number,
        opts?: { deleteExisting: boolean },
    ): Promise<Review[]> {
        // delete existing (if stated) reviews first
        if (opts?.deleteExisting) await this.reviewRepository.deleteAll();
        // fetch users
        const usersInDb = await this.userRepository.find({ select: { id: true } });
        if (usersInDb.length === 0) throw new Error('No users found. Seed users first');
        const usersIds = usersInDb.map((e) => e.id);
        // fetch items
        const itemsInDb = await this.itemRepository.find({ select: { id: true } });
        if (itemsInDb.length === 0) throw new Error('No items found. Seed users first');
        const itemsIds = itemsInDb.map((e) => e.id);
        // seed
        const promises = new Array<Promise<Review>>();
        for (const itemId of itemsIds) {
            for (let i = 0; i < reviewsPerItem; i++) {
                const randomUserId = usersIds[Math.floor(Math.random() * usersIds.length)];
                promises.push(
                    this.reviewRepository.save({
                        ...this.reviewsSeed.review,
                        relatedItem: itemId,
                        createdBy: randomUserId,
                    }),
                );
            }
        }
        const reviews = await Promise.all(promises);
        this.logger.debug(`${reviewsPerItem} reviews per item seeded`);
        return reviews;
    }

    // all the users vote on every review once
    async createVotesForReviews() {
        // Delete existing its mandatory since only one vote per user per review is allowed
        await this.voteRepository.deleteAll();
        // fetch users
        const usersInDb = await this.userRepository.find({ select: { id: true } });
        if (usersInDb.length === 0) throw new Error('No users found. Seed users first');
        const usersIds = usersInDb.map((e) => e.id);
        // fetch reviews
        const reviewsInDb = await this.reviewRepository.find({ select: { id: true } });
        if (reviewsInDb.length === 0) throw new Error('No reviews found. Seed users first');
        const reviewsIds = reviewsInDb.map((e) => e.id);
        // seed votes
        const promises = new Array<Promise<void>>();
        for (const createdBy of usersIds) {
            for (const reviewId of reviewsIds) {
                const transaction = this.dataSource.transaction(async (manager: EntityManager) => {
                    const randomVote = Object.values(VoteAction).at(Math.floor(Math.random() * 2))!;
                    await manager.withRepository(this.voteRepository).save({
                        vote: randomVote,
                        createdBy,
                        reviewId,
                    });
                    await manager
                        .withRepository(this.reviewRepository)
                        .increment(
                            { id: reviewId },
                            randomVote === VoteAction.UP ? 'upVotes' : 'downVotes',
                            1,
                        );
                });
                promises.push(transaction);
            }
        }
        await Promise.all(promises);
    }
}

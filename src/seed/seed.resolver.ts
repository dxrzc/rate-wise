import { Controller } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Args, Int, Mutation } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('seed')
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Mutation(() => Boolean, {
        name: 'seedUsers',
        description:
            'Seed the database with a specified number of test users. Deletes existing users first.',
    })
    async seedUsers(@Args('quantity', { type: () => Int }) n: number) {
        await this.seedService.createUsers(n, { deleteExisting: true });
        return true;
    }

    @Public()
    @Mutation(() => Boolean, {
        name: 'seedItems',
        description:
            'Seed the database with a specified number of items per user. Deletes existing items first.',
    })
    async seedItems(@Args('items_per_user', { type: () => Int }) n: number) {
        await this.seedService.createItems(n, { deleteExisting: true });
        return true;
    }

    @Public()
    @Mutation(() => Boolean, {
        name: 'seedReviews',
        description:
            'Seed the database with a specified number of reviews per item. Deletes existing reviews first.',
    })
    async seedReviews(@Args('reviews_per_item', { type: () => Int }) n: number) {
        await this.seedService.createReviews(n, { deleteExisting: true });
        return true;
    }

    @Public()
    @Mutation(() => Boolean, {
        name: 'seedVotes',
        description:
            'Seed the database with votes for all reviews by all users. Deletes existing votes first.',
    })
    async seedVotes() {
        await this.seedService.createVotesForReviews();
        return true;
    }
}

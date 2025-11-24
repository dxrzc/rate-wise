import { Controller } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Args, Int, Mutation } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('seed')
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Mutation(() => Boolean)
    async seedUsers(@Args('quantity', { type: () => Int }) n: number) {
        await this.seedService.createUsers(n);
        return true;
    }

    @Public()
    @Mutation(() => Boolean)
    async seedItems(@Args('items_per_user', { type: () => Int }) n: number) {
        await this.seedService.createItems(n);
        return true;
    }

    @Public()
    @Mutation(() => Boolean)
    async seedReviews(@Args('reviews_per_item', { type: () => Int }) n: number) {
        await this.seedService.createReviews(n);
        return true;
    }
}

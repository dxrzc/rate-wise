import { Controller } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Args, Mutation } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';
import { SeedInput } from './dtos/seed.input';
import { runSeedDocs } from './docs/runSeed.docs';

@Controller('seed')
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Mutation(() => Boolean, runSeedDocs)
    async runSeed(@Args('seed_options') seedOptions: SeedInput): Promise<boolean> {
        await this.seedService.runSeed(seedOptions);
        return true;
    }
}

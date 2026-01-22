import { Controller } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Args, Mutation } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';
import { runSeedDocs } from './docs/runSeed.docs';
import { SeedArgs } from './dtos/args/seed.args';

@Controller('seed')
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Mutation(() => Boolean, runSeedDocs)
    async runSeed(@Args() seedOptions: SeedArgs): Promise<boolean> {
        await this.seedService.runSeed(seedOptions);
        return true;
    }
}

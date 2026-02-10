import { Controller } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Mutation } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';
import { runSeedDocs } from './graphql/docs/runSeed.docs';

@Controller('seed')
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Mutation(() => Boolean, runSeedDocs)
    async runSeed(): Promise<boolean> {
        await this.seedService.runSeed();
        return true;
    }
}

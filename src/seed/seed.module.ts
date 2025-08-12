import { Module } from '@nestjs/common';
import { UserSeedService } from './services/user-seed.service';

@Module({
    providers: [UserSeedService],
})
export class SeedModule {}

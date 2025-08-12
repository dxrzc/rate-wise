import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [SeedResolver, SeedService, UserSeedService],
})
export class SeedModule {}

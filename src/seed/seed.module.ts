import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), LoggingModule],
    providers: [SeedResolver, SeedService, UserSeedService],
})
export class SeedModule {}

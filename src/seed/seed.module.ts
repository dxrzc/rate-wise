import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from './services/items-seed.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Item]),
        HttpLoggerModule.forFeature({ context: SeedService.name }),
    ],
    providers: [SeedResolver, SeedService, UserSeedService, ItemsSeedService],
})
export class SeedModule {}

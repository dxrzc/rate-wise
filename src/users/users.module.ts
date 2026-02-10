import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { createUserCacheKey } from './cache/create-cache-key';
import { Item } from 'src/items/entities/item.entity';

@Module({
    imports: [
        PaginationModule.register({
            createCacheKeyFunction: createUserCacheKey,
            repositoryToken: getRepositoryToken(User),
        }),
        HttpLoggerModule.forFeature({ context: UsersService.name }),
        TypeOrmModule.forFeature([User, Item]),
    ],
    providers: [UsersResolver, UsersService],
    exports: [UsersService],
})
export class UsersModule {}

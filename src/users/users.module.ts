import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { forwardRef, Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { createUserCacheKey } from './cache/create-cache-key';
import { ItemsModule } from 'src/items/items.module';
import { Item } from 'src/items/entities/item.entity';

@Module({
    imports: [
        forwardRef(() => ItemsModule),
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

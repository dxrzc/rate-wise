import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput } from './dtos/create-item.input';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { ITEMS_MESSAGES } from './messages/items.messages';
import { getDuplicatedErrorKeyDetail } from 'src/common/functions/error/get-duplicated-key-error-detail';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { ItemModel } from './models/item.model';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createItemCacheKey } from './cache/create-cache-key';
import { deserializeItem } from './functions/deserialize-item.entity';
import { PaginationService } from 'src/pagination/pagination.service';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ItemsService {
    constructor(
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly logger: HttpLoggerService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private readonly paginationService: PaginationService<ItemModel>,
        private readonly usersService: UsersService,
    ) {}

    private validUuidOrThrow(id: string) {
        if (!validUUID(id)) {
            this.logger.error('Invalid UUID');
            throw GqlHttpError.NotFound(ITEMS_MESSAGES.NOT_FOUND);
        }
    }

    async findAllByUser(
        userId: string,
        pagArgs: PaginationArgs,
    ): Promise<IPaginatedType<ItemModel>> {
        await this.usersService.findOneByIdOrThrow(userId);
        const sqbAlias = 'item';
        return await this.paginationService.create({
            ...pagArgs,
            cache: true,
            queryBuilder: {
                sqbModifier: (qb) => qb.where(`${sqbAlias}.account_id = :userId`, { userId }),
                sqbAlias,
            },
        });
    }

    /**
     * - Find all items using provided limit and cursor
     * - Attempts to fetch from cache first.
     */
    async findAll(paginationArgs: PaginationArgs): Promise<IPaginatedType<ItemModel>> {
        return await this.paginationService.create({
            ...paginationArgs,
            cache: true,
        });
    }

    // id must be validated previously
    private async findByIdOrThrowPrivate(uuid: string) {
        const itemFound = await this.itemRepository.findOneBy({ id: uuid });
        if (!itemFound) {
            this.logger.error(`Item with id ${uuid} not found`);
            throw GqlHttpError.NotFound(ITEMS_MESSAGES.NOT_FOUND);
        }
        return itemFound;
    }

    async findOneByIdOrThrow(id: string): Promise<Item> {
        this.validUuidOrThrow(id);
        return await this.findByIdOrThrowPrivate(id);
    }

    async findOneByIdOrThrowCached(id: string): Promise<Item> {
        this.validUuidOrThrow(id);
        const cacheKey = createItemCacheKey(id);
        const itemInCache = await this.cacheManager.get<Item>(cacheKey);
        if (!itemInCache) {
            const itemFound = await this.findByIdOrThrowPrivate(id);
            await this.cacheManager.set(cacheKey, itemFound);
            this.logger.info(`Item with id ${id} cached`);
            return itemFound;
        }
        const itemDeserialized = deserializeItem(itemInCache);
        this.logger.info(`Item with id ${id} retrieved from cache`);
        return itemDeserialized;
    }

    async createOne(item: CreateItemInput, user: AuthenticatedUser): Promise<ItemModel> {
        try {
            const created = await this.itemRepository.save({ ...item, createdBy: user.id });
            this.logger.info(`Item with id ${created.id} by user ${user.id} created`);
            return created;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(ITEMS_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async updateItemAvgRating(item: Item, newAvg: number): Promise<Item> {
        item.averageRating = newAvg;
        await this.itemRepository.save(item);
        this.logger.info(`Item with id ${item.id} avg rating updated to ${newAvg}`);
        return item;
    }
}

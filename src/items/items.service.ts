import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput } from './dtos/create-item.input';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { isDuplicatedKeyError } from 'src/common/errors/is-duplicated-key-error';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { ITEMS_MESSAGES } from './messages/items.messages';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ItemModel } from './models/item.model';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createItemCacheKey } from './cache/create-cache-key';
import { deserializeItem } from './functions/deserialize-item.entity';
import { PaginationService } from 'src/pagination/pagination.service';
import { UsersService } from 'src/users/users.service';
import { ItemFiltersArgs } from './dtos/args/item-filters.args';
import { getDuplicatedErrorKeyDetails } from 'src/common/errors/get-duplicated-key-error-details';

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

    async filterItems(filters: ItemFiltersArgs) {
        if (filters.createdBy) await this.usersService.findOneByIdOrThrow(filters.createdBy);
        const sqbAlias = 'item';
        return await this.paginationService.create({
            cursor: filters.cursor,
            limit: filters.limit,
            cache: true,
            queryBuilder: {
                sqbModifier: (qb) => {
                    if (filters.createdBy) {
                        qb.andWhere(`${sqbAlias}.createdBy = :createdBy`, {
                            createdBy: filters.createdBy,
                        });
                    }
                    if (filters.category) {
                        qb.andWhere(`${sqbAlias}.category = :category`, {
                            category: filters.category,
                        });
                    }
                    if (filters.tag) {
                        qb.andWhere(`:tag = ANY(${sqbAlias}.tags)`, { tag: filters.tag });
                    }
                    return qb;
                },
                sqbAlias,
            },
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
            // Type assertion needed: averageRating is computed by GraphQL @ResolveField, not stored in DB
            return created as unknown as ItemModel;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetails(error));
                throw GqlHttpError.Conflict(ITEMS_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }
}

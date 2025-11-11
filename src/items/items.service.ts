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
// import { IItemDbRecord } from './interfaces/item-db-record.interface';
// import { rawRecordToItemEntity } from './functions/raw-record-to-item-entity';
// import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
// import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
// import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
// import { IPaginatedType } from 'src/common/interfaces/pagination/paginated-type.interface';

@Injectable()
export class ItemsService {
    constructor(
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly logger: HttpLoggerService,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) {}

    private validUuidOrThrow(id: string) {
        if (!validUUID(id)) {
            this.logger.error('Invalid UUID');
            throw GqlHttpError.NotFound(ITEMS_MESSAGES.NOT_FOUND);
        }
    }

    // async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<Item>> {
    //     const limit = pagArgs.limit;
    //     const decodedCursor = pagArgs.cursor ? decodeCursor(pagArgs.cursor) : undefined;
    //     const edges = await createPaginationEdges<Item, IItemDbRecord>({
    //         repository: this.itemRepository,
    //         transformFunction: rawRecordToItemEntity,
    //         decodedCursor,
    //         limit,
    //     });
    //     const hasNextPage = edges.length > limit;
    //     if (hasNextPage) edges.pop();
    //     const totalCount = await this.itemRepository.createQueryBuilder().getCount();
    //     return {
    //         edges,
    //         nodes: edges.map((edge) => edge.node),
    //         totalCount,
    //         hasNextPage,
    //     };
    // }

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
            const created = await this.itemRepository.save({ ...item, user: { id: user.id } });
            this.logger.info(`Item with id ${created.id} by user ${user.id} created`);
            return { ...created, createdBy: created.user.id };
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(ITEMS_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }

    // updateOne(id: number, data: UpdateItemInput): Item {
    //     const item = itemsSeed.find((item) => item.id === id);
    //     if (!item) throw new NotFoundException(`Item with id ${id} not found`);
    //     Object.assign(item, data);
    //     return item;
    // }

    // deleteOne(id: number) {
    //     const itemIndex = itemsSeed.findIndex((item) => item.id === id);
    //     if (itemIndex === -1)
    //         throw new NotFoundException(`Item with id ${id} not found`);
    //     itemsSeed.splice(itemIndex, 1);
    //     return true;
    // }
}

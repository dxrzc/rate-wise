import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { ItemModel } from './models/item.model';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput } from './dtos/input/create-item.input';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { rawRecordToItemEntity } from './functions/raw-record-to-item-entity';
import { IPaginatedType } from 'src/common/interfaces/paginated-type.interface';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
import { IItemDbRecord } from './interfaces/item-db-record.interface';

@Injectable()
export class ItemsService {
    constructor(
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
    ) {}

    async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<ItemModel>> {
        const limit = pagArgs.limit;
        const decodedCursor = pagArgs.cursor
            ? decodeCursor(pagArgs.cursor)
            : undefined;
        const edges = await createPaginationEdges<ItemModel, IItemDbRecord>(
            this.itemRepository,
            limit,
            rawRecordToItemEntity,
            decodedCursor,
        );
        const hasNextPage = edges.length > limit;
        if (hasNextPage) edges.pop();
        const totalCount = await this.itemRepository
            .createQueryBuilder()
            .getCount();
        return {
            edges,
            nodes: edges.map((edge) => edge.node),
            totalCount,
            hasNextPage,
        };
    }

    async findOneById(id: string): Promise<ItemModel> {
        if (!validUUID(id))
            throw new BadRequestException('Id is not a valid UUID');
        const itemFound = await this.itemRepository.findOneBy({ id });
        if (!itemFound)
            throw new NotFoundException(`User with id ${id} not found`);
        return itemFound;
    }

    async createOne(item: CreateItemInput) {
        try {
            return await this.itemRepository.save(item);
        } catch (error) {
            if (isDuplicatedKeyError(error))
                throw new BadRequestException('User already exists');
            throw new InternalServerErrorException(error);
        }
    }

    // updateOne(id: number, data: UpdateItemInput): ItemModel {
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

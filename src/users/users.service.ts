import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserModel } from './models/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserInput } from './dtos/input/create-user.input';
import { IUserDbRecord } from './interfaces/user-db-record.interface';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { IPaginatedType } from 'src/common/interfaces/paginated-type.interface';
import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
import { rawRecordTouserEntity } from './logic/raw-record-to-user-entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<UserModel>> {
        const limit = pagArgs.limit;
        const decodedCursor = pagArgs.cursor
            ? decodeCursor(pagArgs.cursor)
            : undefined;
        // fetches limit + 1 records so we can detect whether there’s a next page
        const edges = await createPaginationEdges<UserModel, IUserDbRecord>(
            this.userRepository,
            limit,
            rawRecordTouserEntity,
            decodedCursor,
        );
        const hasNextPage = edges.length > limit;
        if (hasNextPage) edges.pop();
        const totalCount = await this.userRepository
            .createQueryBuilder()
            .getCount();
        return {
            edges,
            nodes: edges.map((edge) => edge.node),
            totalCount,
            hasNextPage,
        };
    }

    async findOneById(id: string): Promise<UserModel> {
        if (!validUUID(id))
            throw new BadRequestException('Id is not a valid UUID');
        const userFound = await this.userRepository.findOneBy({ id });
        if (!userFound)
            throw new NotFoundException(`User with id ${id} not found`);
        return userFound;
    }

    async createOne(user: CreateUserInput): Promise<UserModel> {
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            if (isDuplicatedKeyError(error))
                throw new BadRequestException('User already exists');
            throw new InternalServerErrorException(error);
        }
    }
}

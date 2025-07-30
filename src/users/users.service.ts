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
import { transformRawDbData } from './logic/transform-raw-db-data';
import { IUserDbRecord } from './interfaces/user-db-record.interface';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { IDecodedCursor } from 'src/common/interfaces/decoded-cursor.interface';
import { ICursorPagination } from 'src/common/interfaces/cursor-pagination.interface';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { createCursorPagination } from 'src/common/functions/pagination/create-cursor-pagination';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    // TODO: page info
    async findAll(
        paginationArgs: PaginationArgs,
    ): Promise<ICursorPagination<UserModel>> {
        const limit = paginationArgs.limit;
        // cursor is optional
        let decodedCursor: IDecodedCursor | undefined = undefined;
        if (paginationArgs.cursor)
            decodedCursor = decodeCursor(paginationArgs.cursor);
        const { rawData, nextCursor } = await createCursorPagination<
            User,
            IUserDbRecord
        >(this.userRepository, limit, decodedCursor);
        if (!rawData || !nextCursor) return { data: [], nextCursor: undefined };
        // transform data
        return { data: rawData.map(transformRawDbData), nextCursor };
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

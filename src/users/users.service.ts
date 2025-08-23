import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { USER_ALREADY_EXISTS } from './messages/user.messages';
import { IUserDbRecord } from './interfaces/user-db-record.interface';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { rawRecordTouserEntity } from './functions/raw-record-to-user-entity';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { IPaginatedType } from 'src/common/interfaces/pagination/paginated-type.interface';
import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
import { USER_NOT_FOUND } from './constants/errors.constants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class UsersService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        const limit = pagArgs.limit;
        const decodedCursor = pagArgs.cursor
            ? decodeCursor(pagArgs.cursor)
            : undefined;
        // fetches limit + 1 records so we can detect whether there’s a next page
        const edges = await createPaginationEdges<User, IUserDbRecord>(
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

    async findOneByIdOrThrow(id: string): Promise<User> {
        if (!validUUID(id)) {
            this.logger.error('Invalid UUID');
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const userFound = await this.userRepository.findOneBy({ id });
        if (!userFound) {
            this.logger.error(`User with id ${id} not found`);
            throw new NotFoundException(USER_NOT_FOUND);
        }
        return userFound;
    }

    async findOneByEmail(email: string): Promise<User | null> {
        const userFound = await this.userRepository.findOneBy({ email });
        return userFound;
    }

    async findOneByEmailOrThrow(email: string): Promise<User> {
        const userFound = await this.findOneByEmail(email);
        if (!userFound) {
            this.logger.error(`User with email ${email} not found`);
            throw new NotFoundException(USER_NOT_FOUND);
        }
        return userFound;
    }

    async createOne(user: SignUpInput): Promise<User> {
        try {
            const created = await this.userRepository.save(user);
            this.logger.info(`User ${created.id} created successfully`);
            return created;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                console.log(error); // TODO: show duplicated key in log
                throw new BadRequestException(USER_ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }
}

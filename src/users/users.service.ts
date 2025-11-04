import { getDuplicatedErrorKeyDetail } from 'src/common/functions/error/get-duplicated-key-error-detail';
import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
import { IPaginatedType } from 'src/common/interfaces/pagination/paginated-type.interface';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { rawRecordTouserEntity } from './functions/raw-record-to-user-entity';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { IUserDbRecord } from './interfaces/user-db-record.interface';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { USER_MESSAGES } from './messages/user.messages';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly logger: HttpLoggerService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        const limit = pagArgs.limit;
        const decodedCursor = pagArgs.cursor ? decodeCursor(pagArgs.cursor) : undefined;
        // fetches limit + 1 records so we can detect whether there’s a next page
        const edges = await createPaginationEdges<User, IUserDbRecord>(
            this.userRepository,
            limit,
            rawRecordTouserEntity,
            decodedCursor,
        );
        const hasNextPage = edges.length > limit;
        if (hasNextPage) edges.pop();
        const totalCount = await this.userRepository.createQueryBuilder().getCount();
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
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
        }
        const userFound = await this.userRepository.findOneBy({ id });
        if (!userFound) {
            this.logger.error(`User with id ${id} not found`);
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
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
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
        }
        return userFound;
    }

    async saveOne(user: User) {
        try {
            const saved = await this.userRepository.save(user);
            this.logger.info(`User with id ${user.id} saved to database`);
            return saved;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(USER_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async updateOne(id: string, updateData: Partial<User>): Promise<User> {
        const userToUpdate = await this.findOneByIdOrThrow(id);
        Object.assign(userToUpdate, updateData);
        try {
            const updated = await this.userRepository.save(userToUpdate);
            this.logger.info(`User with id ${id} updated in database`);
            return updated;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(USER_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async createOne(user: SignUpInput): Promise<User> {
        try {
            const created = await this.userRepository.save(user);
            this.logger.info(`User created in database`);
            return created;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(USER_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }
}

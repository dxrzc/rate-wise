import { getDuplicatedErrorKeyDetail } from 'src/common/functions/error/get-duplicated-key-error-detail';
import { createPaginationEdges } from 'src/common/functions/pagination/create-pagination-edges';
import { IPaginatedType } from 'src/common/interfaces/pagination/paginated-type.interface';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { rawRecordTouserEntity } from './functions/raw-record-to-user-entity';
import { decodeCursor } from 'src/common/functions/pagination/decode-cursor';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { deserializeUser } from './functions/user-deserializer';
import { createUserCacheKey } from './cache/create-key';

@Injectable()
export class UsersService {
    constructor(
        private readonly logger: HttpLoggerService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) {}

    private async deleteUserFromCache(id: string): Promise<void> {
        const cacheKey = createUserCacheKey(id);
        const wasCached = await this.cacheManager.del(cacheKey);
        if (wasCached) this.logger.info(`User with id ${id} removed from cache`);
    }

    private validUuidOrThrow(id: string) {
        if (!validUUID(id)) {
            this.logger.error('Invalid UUID');
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
        }
    }

    // id must be a valid uuid
    private async findByIdOrThrowPrivate(uuid: string): Promise<User> {
        const userFound = await this.userRepository.findOneBy({ id: uuid });
        if (!userFound) {
            this.logger.error(`Item with id ${uuid} not found`);
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
        }
        return userFound;
    }

    async findOneByIdOrThrow(id: string): Promise<User> {
        this.validUuidOrThrow(id);
        return await this.findByIdOrThrowPrivate(id);
    }

    async findOneByIdOrThrowCached(id: string): Promise<User> {
        this.validUuidOrThrow(id);
        const cacheKey = createUserCacheKey(id);
        const userInCache = await this.cacheManager.get<User>(cacheKey);
        if (!userInCache) {
            const userFound = await this.findOneByIdOrThrow(id);
            await this.cacheManager.set(cacheKey, userFound);
            this.logger.info(`User with id ${id} cached`);
            return userFound;
        }
        const userInCacheDeserialized = deserializeUser(userInCache);
        this.logger.info(`User with id ${id} retrieved from cache`);
        return userInCacheDeserialized;
    }

    async findOneByEmail(email: string): Promise<User | null> {
        const userFound = await this.userRepository.findOneBy({ email });
        return userFound;
    }

    async findAll(pagArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        const limit = pagArgs.limit;
        const decodedCursor = pagArgs.cursor ? decodeCursor(pagArgs.cursor) : undefined;
        // fetches limit + 1 records so we can detect whether there’s a next page
        const edges = await createPaginationEdges<User, IUserDbRecord>({
            transformFunction: rawRecordTouserEntity,
            repository: this.userRepository,
            decodedCursor,
            limit,
        });
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

    async saveOne(user: User) {
        try {
            const saved = await this.userRepository.save(user);
            this.logger.info(`User with id ${user.id} saved to database`);
            await this.deleteUserFromCache(user.id);
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
            await this.deleteUserFromCache(id);
            return updated;
        } catch (error) {
            if (isDuplicatedKeyError(error)) {
                this.logger.error(getDuplicatedErrorKeyDetail(error));
                throw GqlHttpError.Conflict(USER_MESSAGES.ALREADY_EXISTS);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async deleteOne(id: string): Promise<void> {
        const userToDelete = await this.findOneByIdOrThrow(id);
        await this.userRepository.remove(userToDelete);
        this.logger.info(`User with id ${id} deleted from database`);
        await this.deleteUserFromCache(id);
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

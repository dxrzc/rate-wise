import { getDuplicatedErrorKeyDetail } from 'src/common/functions/error/get-duplicated-key-error-detail';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { USER_MESSAGES } from './messages/user.messages';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createUserCacheKey } from './cache/create-cache-key';
import { PaginationService } from 'src/pagination/pagination.service';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';
import { ICreateUserData } from './interfaces/create-user-data.interface';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private readonly paginationService: PaginationService<User>,
        private readonly logger: HttpLoggerService,
    ) {}

    private handleNonExistingUser(id: string): never {
        this.logger.error(`User with id ${id} not found`);
        throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
    }

    async deleteUserFromCache(id: string): Promise<void> {
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

    /**
     * - Validates id
     * - Returned user is null if not found
     */
    async findOneById(id: string): Promise<User | null> {
        this.validUuidOrThrow(id);
        const userFound = await this.userRepository.findOneBy({ id });
        return userFound;
    }

    /**
     * - Validates id
     * - Throws if user not found
     */
    async findOneByIdOrThrow(id: string) {
        const userFound = await this.findOneById(id);
        if (!userFound) this.handleNonExistingUser(id);
        return userFound;
    }

    async findOneByIdOrThrowTx(id: string, manager: EntityManager): Promise<User> {
        this.validUuidOrThrow(id);
        const userFound = await manager.withRepository(this.userRepository).findOneBy({ id });
        if (!userFound) this.handleNonExistingUser(id);
        return userFound;
    }

    /**
     * - Does not validate email
     * - Returned user is null if not found
     */
    async findOneByEmail(email: string): Promise<User | null> {
        const userFound = await this.userRepository.findOneBy({ email });
        return userFound;
    }

    /**
     * - Validates id.
     * - Throws if not found.
     * - Attempts to fetch from cache first.
     */
    async findOneByIdOrThrowCached(id: string): Promise<User> {
        this.validUuidOrThrow(id);
        const cacheKey = createUserCacheKey(id);
        const userInCache = await this.cacheManager.get<User>(cacheKey);
        if (!userInCache) {
            const userFound = await this.findOneByIdOrThrow(id);
            await this.cacheManager.set(cacheKey, {
                ...userFound,
                passwordHash: undefined,
            });
            this.logger.info(`User with id ${id} cached`);
            return userFound;
        }
        return userInCache;
    }

    async findAll(paginationArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        return await this.paginationService.create({
            ...paginationArgs,
            cache: true,
        });
    }

    async existsOrThrow(id: string): Promise<void> {
        this.validUuidOrThrow(id);
        const exists = await this.userRepository.existsBy({ id });
        if (!exists) this.handleNonExistingUser(id);
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

    async deleteOneTx(user: User, manager: EntityManager): Promise<void> {
        await manager.withRepository(this.userRepository).remove(user);
    }

    async createOne(user: ICreateUserData): Promise<User> {
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

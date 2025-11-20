import { getDuplicatedErrorKeyDetail } from 'src/common/functions/error/get-duplicated-key-error-detail';
import { isDuplicatedKeyError } from 'src/common/functions/error/is-duplicated-key-error';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { validUUID } from 'src/common/functions/utils/valid-uuid.util';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { USER_MESSAGES } from './messages/user.messages';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { createUserCacheKey } from './cache/create-cache-key';
import { PaginationService } from 'src/pagination/pagination.service';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';

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

    /**
     * Deletes user in redis cache
     */
    private async deleteUserFromCache(id: string): Promise<void> {
        const cacheKey = createUserCacheKey(id);
        const wasCached = await this.cacheManager.del(cacheKey);
        if (wasCached) this.logger.info(`User with id ${id} removed from cache`);
    }

    /**
     * Validates uuid or throws.
     */
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
        if (!userFound) {
            this.logger.error(`Item with id ${id} not found`);
            throw GqlHttpError.NotFound(USER_MESSAGES.NOT_FOUND);
        }
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
                password: undefined,
            });
            this.logger.info(`User with id ${id} cached`);
            return userFound;
        }
        return userInCache;
    }

    /**
     * - Find all users using provided limit and cursor
     * - Attempts to fetch from cache first.
     */
    async findAll(paginationArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        return await this.paginationService.create({
            ...paginationArgs,
            cache: true,
        });
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

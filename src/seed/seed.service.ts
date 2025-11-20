import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { getRandomUserRoles } from './functions/get-random-user-roles';
import { getRandomAccountStatus } from './functions/get-random-account-status';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from './services/items-seed.service';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly usersSeed: UserSeedService,
        private readonly itemsSeed: ItemsSeedService,
        private readonly logger: HttpLoggerService,
    ) {}

    async createUsers(n: number): Promise<void> {
        // delete existing users first
        await this.userRepository.deleteAll();
        const data = new Array<SignInInput>();
        for (let i = 0; i < n; i++) {
            data.push(this.usersSeed.user);
        }
        const promises = data.map((user) =>
            this.userRepository.save({
                ...user,
                roles: getRandomUserRoles(),
                status: getRandomAccountStatus(),
            }),
        );
        await Promise.all(promises);
        this.logger.debug(`${n} users seeded`);
    }

    async createItems(n: number): Promise<void> {
        // delete existing items first
        await this.itemRepository.deleteAll();
        const results = await this.userRepository.find({ select: { id: true } });
        if (results.length === 0) throw new Error('No users found. Seed users first');
        const usersIds = results.map((e) => e.id);
        const promises = new Array<Promise<unknown>>();
        for (const id of usersIds) {
            for (let i = 0; i < n; i++)
                promises.push(this.itemRepository.save({ ...this.itemsSeed.item, user: { id } }));
        }
        await Promise.all(promises);
    }
}

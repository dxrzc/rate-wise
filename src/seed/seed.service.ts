import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from './services/user-seed.service';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { getRandomUserRoles } from './functions/get-random-user-roles';
import { getRandomAccountStatus } from './functions/get-random-account-status';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly usersSeed: UserSeedService,
        private readonly logger: HttpLoggerService,
    ) {}

    async deleteAll() {
        await this.userRepository.deleteAll();
    }

    async createUsers(n: number): Promise<void> {
        await this.deleteAll();
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
}

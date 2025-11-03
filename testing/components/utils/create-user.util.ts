import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

// App must import UsersModule and SeedModule!.
export async function createUser(app: NestExpressApplication, opts?: Partial<User>) {
    const userRepos = app.get<Repository<User>>(getRepositoryToken(User));
    const userSeed = app.get(UserSeedService);

    const entity = {
        ...userSeed.signUpInput,
        ...opts,
    };

    const created = await userRepos.save(entity);
    return created;
}

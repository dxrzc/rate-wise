import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

export async function deleteUser(app: NestExpressApplication, userId: string) {
    const userRepos = app.get<Repository<User>>(getRepositoryToken(User));
    const result = await userRepos.delete({ id: userId });
    if (result.affected === 0)
        throw new Error(`User with id ${userId} not found`);
}

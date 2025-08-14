import * as bcrypt from 'bcryptjs';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { INVALID_CREDENTIALS } from './constants/errors.constants';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService) {}

    private hashPassword(password: string): string {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    private passwordMatches(hash: string, password: string): boolean {
        return bcrypt.compareSync(password, hash);
    }

    async reAuthenticate(userId: string, password: string): Promise<void> {
        const user = await this.userService.findOneByIdOrThrow(userId);
        const passwordMatches = this.passwordMatches(user.password, password);
        if (!passwordMatches)
            throw new BadRequestException(INVALID_CREDENTIALS);
    }

    async signUp(signUpInput: SignUpInput): Promise<User> {
        signUpInput.password = this.hashPassword(signUpInput.password);
        const user = await this.userService.createOne(signUpInput);
        return user;
    }

    async signIn(credentials: SignInInput): Promise<User> {
        const user = await this.userService.findOneByEmail(credentials.email);
        if (!user || !this.passwordMatches(user.password, credentials.password))
            throw new BadRequestException(INVALID_CREDENTIALS);
        return user;
    }
}

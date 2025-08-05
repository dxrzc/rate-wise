import * as bcrypt from 'bcryptjs';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';

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

    async signUp(signUpInput: SignUpInput): Promise<User> {
        signUpInput.password = this.hashPassword(signUpInput.password);
        const user = await this.userService.createOne(signUpInput);
        return user;
    }

    async signIn(credentials: SignInInput): Promise<User> {
        const user = await this.userService.findOneByEmail(credentials.email);
        if (!user || !this.passwordMatches(user.password, credentials.password))
            throw new BadRequestException('Invalid credentials');
        return user;
    }
}

import { SessionConfigService } from 'src/config/services/session-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RequestContext } from './types/request-context.type';
import { SessionService } from './services/session.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import * as bcrypt from 'bcryptjs';
import {
    INVALID_CREDENTIALS,
    MAX_SESSIONS_REACHED,
} from './constants/errors.constants';

@Injectable()
export class AuthService {
    constructor(
        private readonly sessionConfig: SessionConfigService,
        private readonly serverConfig: ServerConfigService,
        private readonly sessionService: SessionService,
        private readonly userService: UsersService,
    ) {}

    private hashPassword(password: string): string {
        const salt = bcrypt.genSaltSync(this.serverConfig.bcryptSaltRounds);
        return bcrypt.hashSync(password, salt);
    }

    private passwordMatches(hash: string, password: string): boolean {
        return bcrypt.compareSync(password, hash);
    }

    private async reAuthenticate(
        userId: string,
        password: string,
    ): Promise<void> {
        const user = await this.userService.findOneByIdOrThrow(userId);
        const passwordMatches = this.passwordMatches(user.password, password);
        if (!passwordMatches)
            throw new BadRequestException(INVALID_CREDENTIALS);
    }

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        signUpInput.password = this.hashPassword(signUpInput.password);
        const user = await this.userService.createOne(signUpInput);
        await this.sessionService.newSession(req, user.id);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        const user = await this.userService.findOneByEmail(credentials.email);
        if (!user || !this.passwordMatches(user.password, credentials.password))
            throw new BadRequestException(INVALID_CREDENTIALS);

        const sessions = await this.sessionService.activeSessions(user.id);
        if (sessions === this.sessionConfig.maxUserSessions) {
            throw new BadRequestException(MAX_SESSIONS_REACHED);
        }

        await this.sessionService.newSession(req, user.id);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        await this.sessionService.deleteSession(req);
    }

    async signOutAll(
        auth: ReAuthenticationInput,
        userId: string,
    ): Promise<void> {
        await this.reAuthenticate(userId, auth.password);
        await this.sessionService.deleteAllSessions(userId);
    }
}

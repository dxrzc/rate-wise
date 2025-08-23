import {
    INVALID_CREDENTIALS,
    MAX_SESSIONS_REACHED,
} from './constants/errors.constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SessionConfigService } from 'src/config/services/session-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { RequestContext } from './types/request-context.type';
import { SessionService } from './services/session.service';
import { UsersService } from 'src/users/users.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { User } from 'src/users/entities/user.entity';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import * as bcrypt from 'bcryptjs';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
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

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        this.logger.info(`Account creation attemp for ${signUpInput.email}`);
        signUpInput.password = this.hashPassword(signUpInput.password);
        const user = await this.userService.createOne(signUpInput);
        await this.sessionService.newSession(req, user.id);
        this.logger.info(`Account ${signUpInput.email} created successfully `);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        this.logger.info(`Sign in attemp for email ${credentials.email}`);
        const user = await this.userService.findOneByEmail(credentials.email);

        if (!user) {
            this.logger.error(`Email not found`);
            throw new BadRequestException(INVALID_CREDENTIALS);
        }

        if (!this.passwordMatches(user.password, credentials.password)) {
            this.logger.error('Password does not match');
            throw new BadRequestException(INVALID_CREDENTIALS);
        }

        const sessions = await this.sessionService.activeSessions(user.id);
        if (sessions === this.sessionConfig.maxUserSessions) {
            this.logger.error(`Maximum sessions reached for user ${user.id}`);
            throw new BadRequestException(MAX_SESSIONS_REACHED);
        }

        await this.sessionService.newSession(req, user.id);
        this.logger.info(`User ${user.id} signed in successfully`);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        this.logger.info(`Sign out attemp for user ${userId}`);
        await this.sessionService.deleteSession(req);
        this.logger.info(`User ${userId} signed out`);
    }

    async signOutAll(
        auth: ReAuthenticationInput,
        userId: string,
    ): Promise<void> {
        this.logger.info(`Attemp to close all sessions for user: ${userId}`);
        const user = await this.userService.findOneByIdOrThrow(userId);
        const passwordMatches = this.passwordMatches(
            user.password,
            auth.password,
        );
        if (!passwordMatches) {
            this.logger.warn(`Invalid credentials for userId: ${userId}`);
            throw new BadRequestException(INVALID_CREDENTIALS);
        }
        await this.sessionService.deleteAllSessions(userId);
        this.logger.info(`All sessions closed for userId: ${userId}`);
    }
}

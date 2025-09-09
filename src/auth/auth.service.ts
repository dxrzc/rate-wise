import { AuthConfigService } from 'src/config/services/auth.config.service';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { HashingService } from 'src/common/services/hashing.service';
import { RequestContext } from './types/request-context.type';
import { SessionService } from './services/session.service';
import { HttpError } from 'src/common/errors/http.errors';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(
        private readonly authConfig: AuthConfigService,
        private readonly hashingService: HashingService,
        private readonly sessionService: SessionService,
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
    ) {}

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        signUpInput.password = this.hashingService.hash(
            signUpInput.password,
            this.authConfig.passwordSaltRounds,
        );
        const user = await this.userService.createOne(signUpInput);
        await this.sessionService.newSession(req, user.id);
        this.logger.info(`Account ${user.id} created`);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        const user = await this.userService.findOneByEmail(credentials.email);

        if (!user) {
            this.logger.error(`Email not found`);
            throw HttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        if (!this.hashingService.compare(credentials.password, user.password)) {
            this.logger.error('Password does not match');
            throw HttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const sessions = await this.sessionService.activeSessions(user.id);
        if (sessions === this.authConfig.maxUserSessions) {
            this.logger.error(`Maximum sessions reached for user ${user.id}`);
            throw HttpError.BadRequest(AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        }

        await this.sessionService.newSession(req, user.id);
        this.logger.info(`User ${user.id} signed in`);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        await this.sessionService.deleteSession(req);
        this.logger.info(`User ${userId} signed out`);
    }

    async signOutAll(
        auth: ReAuthenticationInput,
        userId: string,
    ): Promise<void> {
        const user = await this.userService.findOneByIdOrThrow(userId);
        const passwordMatches = this.hashingService.compare(
            auth.password,
            user.password,
        );
        if (!passwordMatches) {
            this.logger.warn(`Invalid credentials for userId: ${userId}`);
            throw HttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        await this.sessionService.deleteAllSessions(userId);
        this.logger.info(`All sessions closed for userId: ${userId}`);
    }
}

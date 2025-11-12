import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
} from './constants/tokens.provider.constant';
import { Inject, Injectable } from '@nestjs/common';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { matchesConstraints } from 'src/common/functions/input/input-matches-constraints';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { HashingService } from 'src/common/services/hashing.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { User } from 'src/users/entities/user.entity';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { UsersService } from 'src/users/users.service';
import { runSettledOrThrow } from 'src/common/functions/utils/run-settled-or-throw.util';
import { AUTH_LIMITS } from './constants/auth.constants';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { verifyTokenOrThrow } from './functions/verify-token-or-throw';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { AuthNotifications } from './notifications/auth.notifications';
import { AuthTokenService } from './types/auth-tokens-service.type';
import { RequestContext } from './types/request-context.type';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accountVerificationToken: AuthTokenService,
        @Inject(ACCOUNT_DELETION_TOKEN)
        private readonly accountDeletionToken: AuthTokenService,
        private readonly authConfig: AuthConfigService,
        private readonly hashingService: HashingService,
        private readonly sessionService: SessionsService,
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
        private readonly authNotifs: AuthNotifications,
    ) {}

    private async passwordsMatchOrThrow(dbPassword: string, incomingPassword: string) {
        const passwordMatch = await this.hashingService.compare(incomingPassword, dbPassword);
        if (!passwordMatch) {
            this.logger.error('Password does not match');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private async userDoesNotExceedMaxSessionsOrThrow(userId: string) {
        const sessions = await this.sessionService.count(userId);
        if (sessions >= this.authConfig.maxUserSessions) {
            this.logger.error(`Maximum sessions reached for user ${userId}`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        }
    }

    private validatePasswordConstraintsOrThrow(password: string) {
        if (!matchesConstraints(password, AUTH_LIMITS.PASSWORD)) {
            this.logger.error('Invalid password length');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private validateEmailConstraintsOrThrow(email: string) {
        if (!matchesConstraints(email, AUTH_LIMITS.EMAIL)) {
            this.logger.error('Invalid email length');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private async hashPassword(password: string): Promise<string> {
        const hash = await this.hashingService.hash(password, this.authConfig.passwordSaltRounds);
        return hash;
    }

    private async getUserInEmailOrThrow(email: string): Promise<User> {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            this.logger.error(`Email not found`);
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        return user;
    }

    async verifyAccount(tokenInUrl: string): Promise<{ alreadyVerified: boolean }> {
        const { id, jti, exp } = await verifyTokenOrThrow(
            this.accountVerificationToken,
            this.logger,
            tokenInUrl,
        );
        const user = await this.userService.findOneByIdOrThrow(id);
        if (user.status === AccountStatus.SUSPENDED) {
            this.logger.error(`Account ${user.id} suspended`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        }
        if (user.status !== AccountStatus.PENDING_VERIFICATION) {
            this.logger.error(`Account ${user.id} already verified`);
            return { alreadyVerified: true };
        }
        user.status = AccountStatus.ACTIVE;
        await runSettledOrThrow([
            this.userService.saveOne(user),
            this.accountVerificationToken.blacklist(jti, exp),
        ]);
        this.logger.info(`Account ${user.id} verified successfully`);
        return { alreadyVerified: false };
    }

    async deleteAccount(tokenInUrl: string): Promise<void> {
        const { id, jti, exp } = await verifyTokenOrThrow(
            this.accountDeletionToken,
            this.logger,
            tokenInUrl,
        );
        await runSettledOrThrow([
            this.userService.deleteOne(id),
            this.accountDeletionToken.blacklist(jti, exp),
            this.sessionService.deleteAll(id),
        ]);
        this.logger.info(`Account ${id} deleted successfully`);
    }

    async requestAccountVerification(user: AuthenticatedUser) {
        if (user.status !== AccountStatus.PENDING_VERIFICATION) {
            this.logger.error(`Account ${user.id} already verified`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
        }
        await this.authNotifs.sendAccountVerificationEmail(user);
        this.logger.info(`Queued account verification email for user ${user.id}`);
    }

    async requestAccountDeletion(user: AuthenticatedUser) {
        await this.authNotifs.sendAccountDeletionEmail(user);
        this.logger.info(`Queued account deletion email for user ${user.id}`);
    }

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        signUpInput.password = await this.hashPassword(signUpInput.password);
        const user = await this.userService.createOne(signUpInput);
        await this.sessionService.create(req, user.id);
        this.logger.info(`Account ${user.id} created`);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        this.validateEmailConstraintsOrThrow(credentials.email);
        this.validatePasswordConstraintsOrThrow(credentials.password);
        const user = await this.getUserInEmailOrThrow(credentials.email);
        await this.passwordsMatchOrThrow(user.password, credentials.password);
        await this.userDoesNotExceedMaxSessionsOrThrow(user.id);
        await this.sessionService.create(req, user.id);
        this.logger.info(`User ${user.id} signed in`);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        await this.sessionService.delete(req);
        this.logger.info(`User ${userId} signed out`);
    }

    async signOutAll(auth: ReAuthenticationInput, userId: string): Promise<void> {
        this.validatePasswordConstraintsOrThrow(auth.password);
        const user = await this.userService.findOneByIdOrThrow(userId);
        await this.passwordsMatchOrThrow(user.password, auth.password);
        await this.sessionService.deleteAll(userId);
        this.logger.info(`All sessions closed for userId: ${userId}`);
    }

    async suspendAccount(userId: string): Promise<void> {
        const targetUser = await this.userService.findOneByIdOrThrow(userId);
        if (targetUser.roles.includes(UserRole.ADMIN)) {
            this.logger.warn(`Admin user ${targetUser.id} cannot be suspended`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.FORBIDDEN);
        }
        if (targetUser.status === AccountStatus.SUSPENDED) {
            this.logger.warn(`User ${targetUser.id} is already suspended`);
            throw GqlHttpError.Conflict(AUTH_MESSAGES.ACCOUNT_ALREADY_SUSPENDED);
        }
        targetUser.status = AccountStatus.SUSPENDED;
        await this.userService.saveOne(targetUser);
        this.logger.info(`User ${targetUser.id} account suspended`);
    }
}

import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
    SIGN_OUT_ALL_TOKEN,
} from './constants/tokens.provider.constant';
import { Inject, Injectable } from '@nestjs/common';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { HashingService } from 'src/common/services/hashing.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { User } from 'src/users/entities/user.entity';
import { AccountStatus } from 'src/users/enums/account-status.enum';
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
import { matchesLengthConstraints } from 'src/common/functions/input/matches-length-constraints';
import { UserDeletionService } from 'src/orchestrators/user-deletion/user-deletion.service';
import { SystemLogger } from 'src/common/logging/system.logger';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accountVerificationToken: AuthTokenService,
        @Inject(ACCOUNT_DELETION_TOKEN)
        private readonly accountDeletionToken: AuthTokenService,
        @Inject(SIGN_OUT_ALL_TOKEN)
        private readonly signOutAllToken: AuthTokenService,
        private readonly authConfig: AuthConfigService,
        private readonly hashingService: HashingService,
        private readonly sessionService: SessionsService,
        private readonly userService: UsersService,
        private readonly userDeletionService: UserDeletionService,
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

    private validatePasswordConstraintsOrThrow(password: string) {
        if (!matchesLengthConstraints(password, AUTH_LIMITS.PASSWORD)) {
            this.logger.error('Invalid password length');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
    }

    private accountIsNotAlreadyVerifiedOrThrow(user: Pick<User, 'status' | 'id'>) {
        if (user.status === AccountStatus.ACTIVE) {
            this.logger.error(`Account ${user.id} already verified`);
            throw GqlHttpError.Conflict(AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
        }
    }

    async verifyAccount(tokenInUrl: string) {
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
        this.accountIsNotAlreadyVerifiedOrThrow(user);
        user.status = AccountStatus.ACTIVE;
        await this.userService.saveOne(user);
        try {
            await this.accountVerificationToken.blacklist(jti, exp);
        } catch (error) {
            this.logger.error('Verification token blacklisted failed');
            SystemLogger.getInstance().logAny(error, AuthService.name);
        }
        this.logger.info(`Account ${user.id} verified successfully`);
    }

    async deleteAccount(tokenInUrl: string): Promise<void> {
        const { id, jti, exp } = await verifyTokenOrThrow(
            this.accountDeletionToken,
            this.logger,
            tokenInUrl,
        );
        await runSettledOrThrow([
            this.userDeletionService.deleteOne(id),
            this.accountDeletionToken.blacklist(jti, exp),
            this.sessionService.deleteAll(id),
        ]);
        this.logger.info(`Account ${id} deleted successfully`);
    }

    async requestAccountVerification(user: AuthenticatedUser) {
        this.accountIsNotAlreadyVerifiedOrThrow(user);
        await this.authNotifs.sendAccountVerificationEmail(user);
        this.logger.info(`Queued account verification email for user ${user.id}`);
    }

    async requestAccountDeletion(user: AuthenticatedUser) {
        await this.authNotifs.sendAccountDeletionEmail(user);
        this.logger.info(`Queued account deletion email for user ${user.id}`);
    }

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        const passwordHash = await this.hashingService.hash(signUpInput.password);
        const user = await this.userService.createOne({
            ...signUpInput,
            passwordHash,
        });
        await this.sessionService.create(req, user.id);
        this.logger.info(`Account ${user.id} created`);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        this.validatePasswordConstraintsOrThrow(credentials.password);
        const user = await this.userService.findOneByEmail(credentials.email);
        if (!user) {
            this.logger.error('User with provided email does not exist');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        await this.passwordsMatchOrThrow(user.passwordHash, credentials.password);
        const sessions = await this.sessionService.count(user.id);
        if (sessions >= this.authConfig.maxUserSessions) {
            this.logger.error(`Maximum sessions reached for user ${user.id}`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        }
        await this.sessionService.create(req, user.id);
        this.logger.info(`User ${user.id} signed in`);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        await this.sessionService.destroy(req);
        this.logger.info(`User ${userId} signed out`);
    }

    async signOutAll(auth: ReAuthenticationInput, req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        this.validatePasswordConstraintsOrThrow(auth.password);
        const user = await this.userService.findOneByIdOrThrow(userId);
        await this.passwordsMatchOrThrow(user.passwordHash, auth.password);
        await this.sessionService.destroyAll(req);
        this.logger.info(`All sessions closed for userId: ${userId}`);
    }

    async requestSignOutAll(email: string): Promise<void> {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            this.logger.error('User in email does not exist, skipping email sending');
            return;
        }
        if (user.status === AccountStatus.SUSPENDED) {
            this.logger.error('Account suspended, skipping email sending');
            return;
        }
        await this.authNotifs.sendSignOutAllEmail(user);
        this.logger.info(`Queued sign-out-all email for user ${user.id}`);
    }

    async signOutAllPublic(tokenInUrl: string) {
        const { id, jti, exp } = await verifyTokenOrThrow(
            this.signOutAllToken,
            this.logger,
            tokenInUrl,
        );
        await this.userService.existsOrThrow(id);
        const [sessions] = await runSettledOrThrow<[number, void]>([
            this.sessionService.deleteAll(id),
            this.signOutAllToken.blacklist(jti, exp),
        ]);
        this.logger.info(`${sessions} sessions of user ${id} have been deleted successfully`);
    }
}

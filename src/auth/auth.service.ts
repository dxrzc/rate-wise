import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
} from '@nestjs/common';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { matchesConstraints } from 'src/common/functions/input/input-matches-constraints';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { HashingService } from 'src/common/services/hashing.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { TokensService } from 'src/tokens/tokens.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AUTH_LIMITS } from './constants/auth.constants';
import { ACCOUNT_VERIFICATION_TOKEN } from './constants/tokens.provider.constant';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { IAccVerifTokenPayload } from './interfaces/tokens-payload.interface';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { AuthNotifications } from './notifications/auth.notifications';
import { RequestContext } from './types/request-context.type';
import { UserStatus } from 'src/users/enum/user-status.enum';
import { verifyTokenOrThrow } from './functions/verify-token-or-throw';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accVerifToken: TokensService<IAccVerifTokenPayload>,
        private readonly authConfig: AuthConfigService,
        private readonly hashingService: HashingService,
        private readonly sessionService: SessionsService,
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
        private readonly authNotifs: AuthNotifications,
    ) {}

    // REST endpoint related
    async verifyAccount(tokenInUrl: string) {
        const { id, jti, exp } = await verifyTokenOrThrow(
            this.accVerifToken,
            this.logger,
            tokenInUrl,
        );
        const user = await this.userService.findOneByIdOrThrow(id);
        if (user.status === UserStatus.SUSPENDED) {
            this.logger.error(`Account ${user.id} suspended`);
            throw new ForbiddenException(AUTH_MESSAGES.ACCOUNT_SUSPENDED);
        }
        if (user.status !== UserStatus.PENDING_VERIFICATION) {
            this.logger.error(`Account ${user.id} already verified`);
            throw new BadRequestException(
                AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
            );
        }
        user.status = UserStatus.ACTIVE;
        await this.userService.saveOne(user);
        this.logger.info(`Account ${user.id} verified successfully`);
        await this.accVerifToken.blacklist(jti, exp);
        this.logger.debug(
            `Verification token blacklisted for account ${user.id}`,
        );
    }

    async requestAccountVerification(user: AuthenticatedUser) {
        if (user.status !== UserStatus.PENDING_VERIFICATION) {
            this.logger.error(`Account ${user.id} already verified`);
            throw GqlHttpError.BadRequest(
                AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
            );
        }
        await this.authNotifs.sendAccountVerificationEmail(user);
        this.logger.info(`Verification account email sent to ${user.email}`);
    }

    async signUp(signUpInput: SignUpInput, req: RequestContext): Promise<User> {
        signUpInput.password = await this.hashingService.hash(
            signUpInput.password,
            this.authConfig.passwordSaltRounds,
        );
        const user = await this.userService.createOne(signUpInput);
        await this.sessionService.create(req, user.id);
        this.logger.info(`Account ${user.id} created`);
        return user;
    }

    async signIn(credentials: SignInInput, req: RequestContext): Promise<User> {
        if (!matchesConstraints(credentials.email, AUTH_LIMITS.EMAIL)) {
            this.logger.error('Invalid email length');
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        if (!matchesConstraints(credentials.password, AUTH_LIMITS.PASSWORD)) {
            this.logger.error('Invalid password length');
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const user = await this.userService.findOneByEmail(credentials.email);

        if (!user) {
            this.logger.error(`Email not found`);
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const passwordMatch = await this.hashingService.compare(
            credentials.password,
            user.password,
        );
        if (!passwordMatch) {
            this.logger.error('Password does not match');
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const sessions = await this.sessionService.count(user.id);
        if (sessions >= this.authConfig.maxUserSessions) {
            this.logger.error(`Maximum sessions reached for user ${user.id}`);
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        }

        await this.sessionService.create(req, user.id);
        this.logger.info(`User ${user.id} signed in`);
        return user;
    }

    async signOut(req: RequestContext): Promise<void> {
        const userId = req.session.userId;
        await this.sessionService.delete(req);
        this.logger.info(`User ${userId} signed out`);
    }

    async signOutAll(
        auth: ReAuthenticationInput,
        userId: string,
    ): Promise<void> {
        if (!matchesConstraints(auth.password, AUTH_LIMITS.PASSWORD)) {
            this.logger.error('Invalid password length');
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }

        const user = await this.userService.findOneByIdOrThrow(userId);
        const passwordMatches = await this.hashingService.compare(
            auth.password,
            user.password,
        );
        if (!passwordMatches) {
            this.logger.warn(`Invalid credentials for userId: ${userId}`);
            throw GqlHttpError.BadRequest(AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        await this.sessionService.deleteAll(userId);
        this.logger.info(`All sessions closed for userId: ${userId}`);
    }
}

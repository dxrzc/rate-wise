import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import {
    ALL_ACCOUNT_STATUSES,
    RequireAccountStatus,
} from 'src/common/decorators/min-account-status.decorator';
import { ALL_ROLES, Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { AuthService } from './auth.service';
import { ReAuthenticationInput } from './graphql/inputs/re-authentication.input';
import { SignInInput } from './graphql/inputs/sign-in.input';
import { SignUpInput } from './graphql/inputs/sign-up.input';
import { RequestContext } from './types/request-context.type';
import { AccountModel } from './graphql/models/account.model';
import { signUpDocs } from './graphql/docs/signUp.docs';
import { signInDocs } from './graphql/docs/signIn.docs';
import { requestAccountVerificationDocs } from './graphql/docs/requestAccountVerification.docs';
import { requestAccountDeletionDocs } from './graphql/docs/requestAccountDeletion.docs';
import { signOutDocs } from './graphql/docs/signOut.docs';
import { signOutAllDocs } from './graphql/docs/signOutAll.docs';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { RequestSignOutAllInput } from './graphql/inputs/request-sign-out-all.input';
import { requestSignOutAllDocs } from './graphql/docs/requestSignOutAll.docs';
import { SessionsService } from 'src/sessions/sessions.service';

@Resolver()
export class AuthResolver {
    constructor(
        private readonly authService: AuthService,
        private readonly sessionService: SessionsService,
    ) {}

    @Public()
    @RateLimit(RateLimitTier.CRITICAL)
    @Mutation(() => AccountModel, signUpDocs)
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signUp(user, req);
    }

    @Public()
    @RateLimit(RateLimitTier.CRITICAL)
    @Mutation(() => AccountModel, signInDocs)
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signIn(credentials, req);
    }

    @Roles(ALL_ROLES)
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @RequireAccountStatus(AccountStatus.PENDING_VERIFICATION, AccountStatus.ACTIVE)
    @Mutation(() => Boolean, requestAccountVerificationDocs)
    async requestAccountVerification(@Context('req') req: RequestContext) {
        await this.authService.requestAccountVerification(req.user);
        return true;
    }

    @Roles(ALL_ROLES)
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @RequireAccountStatus(...ALL_ACCOUNT_STATUSES)
    @Mutation(() => Boolean, requestAccountDeletionDocs)
    async requestAccountDeletion(@Context('req') req: RequestContext): Promise<boolean> {
        await this.authService.requestAccountDeletion(req.user);
        return true;
    }

    @Public()
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @Mutation(() => String, requestSignOutAllDocs)
    async requestSignOutAll(@Args('input') input: RequestSignOutAllInput) {
        await this.authService.requestSignOutAll(input.email);
        return AUTH_MESSAGES.EMAIL_SENT_IF_EXISTS;
    }

    @Roles(ALL_ROLES)
    @RateLimit(RateLimitTier.CRITICAL)
    @RequireAccountStatus(ALL_ACCOUNT_STATUSES)
    @Mutation(() => Boolean, signOutDocs)
    async signOut(
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOut(req);
        this.sessionService.clearCookie(res);
        return true;
    }

    @Roles(ALL_ROLES)
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @RequireAccountStatus(ALL_ACCOUNT_STATUSES)
    @Mutation(() => Boolean, signOutAllDocs)
    async signOutAll(
        @Args('credentials') input: ReAuthenticationInput,
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOutAll(input, req);
        this.sessionService.clearCookie(res);
        return true;
    }
}

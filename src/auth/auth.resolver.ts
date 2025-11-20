import {
    CriticalThrottle,
    UltraCriticalThrottle,
} from 'src/common/decorators/throttling.decorator';
import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { AllAccountStatusesAllowed } from 'src/common/decorators/all-account-statuses-allowed.decorator';
import { AllRolesAllowed } from 'src/common/decorators/all-roles-allowed.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { AuthService } from './auth.service';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { RequestContext } from './types/request-context.type';
import { UserRole } from 'src/users/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { requestAccountDeletionDocs } from './docs/request-account-deletion.docs';
import { requestAccountVerificationDocs } from './docs/request-account-verification.docs';
import { signInDocs } from './docs/sign-in.docs';
import { signOutAllDocs } from './docs/sign-out-all.docs';
import { signOutDocs } from './docs/sign-out.docs';
import { signUpDocs } from './docs/sign-up.docs';
import { suspendAccountDocs } from './docs/suspend-account.docs';
import { AccountModel } from './models/account.model';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    private clearCookie(res: Response) {
        res.clearCookie('connect.sid', { path: '/' });
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => AccountModel, signUpDocs)
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signUp(user, req);
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => AccountModel, signInDocs)
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signIn(credentials, req);
    }

    @AllRolesAllowed()
    @UltraCriticalThrottle()
    @MinAccountStatusRequired(AccountStatus.PENDING_VERIFICATION)
    @Mutation(() => Boolean, requestAccountVerificationDocs)
    async requestAccountVerification(@Context('req') req: RequestContext) {
        await this.authService.requestAccountVerification(req.user);
        return true;
    }

    @AllRolesAllowed()
    @CriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, requestAccountDeletionDocs)
    async requestAccountDeletion(@Context('req') req: RequestContext): Promise<boolean> {
        await this.authService.requestAccountDeletion(req.user);
        return true;
    }

    @AllRolesAllowed()
    @CriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, signOutDocs)
    async signOut(
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOut(req);
        this.clearCookie(res);
        return true;
    }

    @AllRolesAllowed()
    @UltraCriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, signOutAllDocs)
    async signOutAll(
        @Args('credentials') input: ReAuthenticationInput,
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOutAll(input, req.session.userId);
        this.clearCookie(res);
        return true;
    }

    @CriticalThrottle()
    @Roles([UserRole.ADMIN, UserRole.MODERATOR])
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Mutation(() => Boolean, suspendAccountDocs)
    async suspendAccount(@Args('user_id', { type: () => ID }) userId: string): Promise<boolean> {
        await this.authService.suspendAccount(userId);
        return true;
    }
}

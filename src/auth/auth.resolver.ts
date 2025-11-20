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
import { AccountModel } from './models/account.model';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    private clearCookie(res: Response) {
        res.clearCookie('connect.sid', { path: '/' });
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => AccountModel, {
        name: 'signUp',
        description: `
            Register a new user account with email and password. 
            Creates a new user session upon successful registration.
        `,
    })
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signUp(user, req);
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => AccountModel, {
        name: 'signIn',
        description: `
            Authenticate a user with email and password credentials. 
            Creates a new user session upon successful authentication.
        `,
    })
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: RequestContext,
    ): Promise<AccountModel> {
        return await this.authService.signIn(credentials, req);
    }

    @AllRolesAllowed()
    @UltraCriticalThrottle()
    @MinAccountStatusRequired(AccountStatus.PENDING_VERIFICATION)
    @Mutation(() => Boolean, {
        name: 'requestAccountVerification',
        description: `
            Send an account verification email to the authenticated user. 
            Only available for users with PENDING_VERIFICATION status.
            Updates account status to ACTIVE upon successful registration.
        `,
    })
    async requestAccountVerification(@Context('req') req: RequestContext) {
        await this.authService.requestAccountVerification(req.user);
        return true;
    }

    @AllRolesAllowed()
    @CriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, {
        name: 'requestAccountDeletion',
        description: `
            Send an account deletion confirmation email to the authenticated user. 
            The user must confirm deletion via the email link.
        `,
    })
    async requestAccountDeletion(@Context('req') req: RequestContext): Promise<boolean> {
        await this.authService.requestAccountDeletion(req.user);
        return true;
    }

    @AllRolesAllowed()
    @CriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, {
        name: 'signOut',
        description: `
            Sign out the authenticated user from the current session. 
            Destroys the current session and clears authentication cookies.
        `,
    })
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
    @Mutation(() => Boolean, {
        name: 'signOutAll',
        description: `
            Sign out the authenticated user from all active sessions. 
            Requires password re-authentication for security. 
            Destroys all user sessions and clears authentication cookies.
        `,
    })
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
    @Mutation(() => Boolean, {
        name: 'suspendAccount',
        description: `
            Suspend a user account, preventing them from accessing the system. 
            Only available to administrators and moderators. 
            Admin accounts cannot be suspended.
        `,
    })
    async suspendAccount(@Args('user_id', { type: () => ID }) userId: string): Promise<boolean> {
        await this.authService.suspendAccount(userId);
        return true;
    }
}

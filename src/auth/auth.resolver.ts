import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { AllAccountStatusesAllowed } from 'src/common/decorators/all-account-statuses-allowed.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import {
    CriticalThrottle,
    UltraCriticalThrottle,
} from 'src/common/decorators/throttling.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserModel } from 'src/users/models/user.model';
import { AuthService } from './auth.service';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { RequestContext } from './types/request-context.type';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    private clearCookie(res: Response) {
        res.clearCookie('connect.sid', { path: '/' });
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => UserModel, { name: 'signUp' })
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: RequestContext,
    ): Promise<UserModel> {
        return await this.authService.signUp(user, req);
    }

    @Public()
    @CriticalThrottle()
    @Mutation(() => UserModel, { name: 'signIn' })
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: RequestContext,
    ): Promise<UserModel> {
        return await this.authService.signIn(credentials, req);
    }

    @UltraCriticalThrottle()
    @MinAccountStatusRequired(AccountStatus.PENDING_VERIFICATION)
    @Mutation(() => Boolean, { name: 'requestAccountVerification' })
    async requestAccountVerification(@Context('req') req: RequestContext) {
        await this.authService.requestAccountVerification(req.user);
        return true;
    }

    @CriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, { name: 'signOut' })
    async signOut(
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOut(req);
        this.clearCookie(res);
        return true;
    }

    @UltraCriticalThrottle()
    @AllAccountStatusesAllowed()
    @Mutation(() => Boolean, { name: 'signOutAll' })
    async signOutAll(
        @Args('credentials') input: ReAuthenticationInput,
        @Context('req') req: RequestContext,
        @Context('res') res: Response,
    ): Promise<boolean> {
        await this.authService.signOutAll(input, req.session.userId);
        this.clearCookie(res);
        return true;
    }
}

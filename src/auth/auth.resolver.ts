import {
    CriticalThrottle,
    UltraCriticalThrottle,
} from 'src/common/decorators/throttling.decorator';
import { ReAuthenticationInput } from './dtos/re-authentication.input';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestContext } from './types/request-context.type';
import { UserModel } from 'src/users/models/user.model';
import { SignInInput } from './dtos/sign-in.input';
import { SignUpInput } from './dtos/sign-up.input';
import { AuthService } from './auth.service';
import { Response } from 'express';

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
    @Mutation(() => Boolean, { name: 'requestAccountVerification' })
    async requestAccountVerification(@Context('req') req: RequestContext) {
        await this.authService.requestAccountVerification(req.user);
        return true;
    }

    @CriticalThrottle()
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

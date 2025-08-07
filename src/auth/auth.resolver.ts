import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';
import { UserModel } from 'src/users/models/user.model';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { regenerateCookie } from './functions/regenerate-cookie';
import { ISessionData } from 'src/common/interfaces/cookies/session-data.interface';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Mutation(() => UserModel, { name: 'signUp' })
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: Request & { session: ISessionData },
    ): Promise<UserModel> {
        const signedUp = await this.authService.signUp(user);
        await regenerateCookie(req, signedUp.id);
        return signedUp;
    }

    @Mutation(() => UserModel, { name: 'signIn' })
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: Request & { session: ISessionData },
    ): Promise<UserModel> {
        const signedIn = await this.authService.signIn(credentials);
        await regenerateCookie(req, signedIn.id);
        return signedIn;
    }
}

import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';
import { UserModel } from 'src/users/models/user.model';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
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
        req.session.userId = signedUp.id;
        return signedUp;
    }

    @Mutation(() => UserModel, { name: 'signIn' })
    async signIn(
        @Args('credentials') credentials: SignInInput,
    ): Promise<UserModel> {
        return await this.authService.signIn(credentials);
    }
}

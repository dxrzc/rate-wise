import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserModel } from 'src/users/models/user.model';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Mutation(() => UserModel, { name: 'signUp' })
    async signUp(@Args('user_data') user: SignUpInput): Promise<UserModel> {
        return await this.authService.signUp(user);
    }

    @Mutation(() => UserModel, { name: 'signIn' })
    async signIn(
        @Args('credentials') credentials: SignInInput,
    ): Promise<UserModel> {
        return await this.authService.signIn(credentials);
    }
}

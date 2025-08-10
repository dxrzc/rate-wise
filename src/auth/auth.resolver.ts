import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignUpInput } from './dtos/sign-up.input';
import { SignInInput } from './dtos/sign-in.input';
import { BadRequestException } from '@nestjs/common';
import { UserModel } from 'src/users/models/user.model';
import { Public } from 'src/common/decorators/public.decorator';
import { MAX_SESSIONS_ERROR } from './constants/errors.constants';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { SessionsService } from './services/session-cookies.service';
import { ISessionData } from 'src/common/interfaces/cookies/session-data.interface';
import { SessionConfigService } from 'src/config/services/session-config.service';

@Resolver()
export class AuthResolver {
    constructor(
        private readonly authService: AuthService,
        private readonly sessionService: SessionsService,
        private readonly sessionConfig: SessionConfigService,
    ) {}

    @Public()
    @Mutation(() => UserModel, { name: 'signUp' })
    async signUp(
        @Args('user_data') user: SignUpInput,
        @Context('req') req: Request & { session: ISessionData },
    ): Promise<UserModel> {
        const signedUp = await this.authService.signUp(user);
        await this.sessionService.newSession(req, signedUp.id);
        return signedUp;
    }

    @Public()
    @Mutation(() => UserModel, { name: 'signIn' })
    async signIn(
        @Args('credentials') credentials: SignInInput,
        @Context('req') req: Request & { session: ISessionData },
    ): Promise<UserModel> {
        const signedIn = await this.authService.signIn(credentials);
        const userId = signedIn.id;
        const activeSessions = await this.sessionService.activeSessions(userId);
        if (activeSessions === this.sessionConfig.maxUserSessions) {
            throw new BadRequestException(MAX_SESSIONS_ERROR);
        }
        await this.sessionService.newSession(req, userId);
        return signedIn;
    }
}

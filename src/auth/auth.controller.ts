import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { accountVerifiedPage } from './pages/account-verified.page';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { UltraCriticalThrottle } from 'src/common/decorators/throttling.decorator';
import { accountDeleted } from './pages/account-deleted.page';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: HttpLoggerService,
    ) {}

    private handleNonProvidedToken() {
        this.logger.error('No token provided in verifyAccount');
        throw new BadRequestException(AUTH_MESSAGES.INVALID_URL);
    }

    @Public()
    @UltraCriticalThrottle()
    @Get('verify-account')
    async verifyAccount(@Query('token') token: string) {
        if (!token) this.handleNonProvidedToken();
        const result = await this.authService.verifyAccount(token);
        if (result.alreadyVerified) {
            return { message: AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED_MESSAGE };
        }
        return accountVerifiedPage();
    }

    @Public()
    @UltraCriticalThrottle()
    @Get('delete-account')
    async deleteAccount(@Query('token') token: string) {
        if (!token) this.handleNonProvidedToken();
        await this.authService.deleteAccount(token);
        return accountDeleted();
    }
}

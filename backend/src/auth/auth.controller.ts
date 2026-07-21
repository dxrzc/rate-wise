import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { accountVerifiedPage } from './pages/account-verified.page';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { accountDeletedPage } from './pages/account-deleted.page';
import { allSignedOutPage } from './pages/all-signed-out.page';

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
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @Get('verify-account')
    async verifyAccount(@Query('token') token: string) {
        if (!token) this.handleNonProvidedToken();
        await this.authService.verifyAccount(token);
        return accountVerifiedPage();
    }

    @Public()
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @Get('delete-account')
    async deleteAccount(@Query('token') token: string) {
        if (!token) this.handleNonProvidedToken();
        await this.authService.deleteAccount(token);
        return accountDeletedPage();
    }

    @Public()
    @RateLimit(RateLimitTier.ULTRA_CRITICAL)
    @Get('sign-out-all')
    async signOutAll(@Query('token') token: string) {
        if (!token) this.handleNonProvidedToken();
        await this.authService.signOutAllPublic(token);
        return allSignedOutPage();
    }
}

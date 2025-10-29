import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { accountVerifiedPage } from './pages/account-verified.page';
import { AUTH_MESSAGES } from './messages/auth.messages';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly logger: HttpLoggerService,
    ) {}

    @Public()
    @Get('verifyAccount')
    async verifyAccount(@Query('token') token: string) {
        if (!token) {
            this.logger.error('No token provided in verifyAccount');
            throw new BadRequestException(AUTH_MESSAGES.INVALID_URL);
        }
        await this.authService.verifyAccount(token);
        return accountVerifiedPage();
    }
}

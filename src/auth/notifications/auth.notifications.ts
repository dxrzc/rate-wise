import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { EmailsService } from 'src/emails/emails.service';
import { TokensService } from 'src/tokens/tokens.service';
import { ACCOUNT_VERIFICATION_TOKEN } from '../constants/tokens.provider.constant';
import { IAccVerifTokenPayload } from '../interfaces/tokens-payload.interface';
import { verifyYourEmailHtml, verifyYourEmailPlainText } from '../pages/verify-your-email.page';
import { ServerConfigService } from 'src/config/services/server.config.service';

@Injectable()
export class AuthNotifications {
    private readonly from = '"Ratewise" <no-reply@ratewise.app>';

    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accVerifToken: TokensService<IAccVerifTokenPayload>,
        private readonly emailsService: EmailsService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    private async createAccountVerificationLink(id: string) {
        const token = await this.accVerifToken.generate({ id });
        return `${this.serverConfig.apiBaseUrl}/auth/verifyAccount?token=${token}`;
    }

    async sendAccountVerificationEmail(user: AuthenticatedUser) {
        const subject = 'Verify your Ratewise account';
        const link = await this.createAccountVerificationLink(user.id);
        const linkExpMin = 30;
        await this.emailsService.sendEmail({
            from: this.from,
            to: user.email,
            subject,
            text: verifyYourEmailPlainText({
                username: user.username,
                linkExpMin,
                link,
            }),
            html: verifyYourEmailHtml({
                username: user.username,
                linkExpMin,
                link,
            }),
        });
    }
}

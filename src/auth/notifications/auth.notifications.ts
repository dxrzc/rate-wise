import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { EmailsService } from 'src/emails/emails.service';
import { TokensService } from 'src/tokens/tokens.service';
import { ACCOUNT_VERIFICATION_TOKEN } from '../constants/tokens.provider.constant';
import { IAccVerifTokenPayload } from '../interfaces/tokens-payload.interface';
import {
    accountVerificationEmailSentPage,
    accountVerificationEmailSentText,
} from '../pages/account-verification-email-sent.page';

@Injectable()
export class AuthNotifications {
    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accVerifToken: TokensService<IAccVerifTokenPayload>,
        private readonly emailsService: EmailsService,
    ) {}

    // TODO:
    private readonly API_BASE_URL = 'http://localhost:3000';

    private async createAccountVerificationLink(id: string) {
        const token = await this.accVerifToken.generate({ id });
        return `${this.API_BASE_URL}/auth/verifyAccount?token=${token}`;
    }

    async sendAccountVerificationEmail(user: AuthenticatedUser) {
        const subject = 'Verify your Ratewise account';
        const link = await this.createAccountVerificationLink(user.id);
        const linkExpMin = 30;
        await this.emailsService.sendEmail({
            from: '"Ratewise" <no-reply@ratewise.app>',
            to: user.email,
            subject,
            text: accountVerificationEmailSentText({
                username: user.username,
                linkExpMin,
                link,
            }),
            html: accountVerificationEmailSentPage({
                username: user.username,
                linkExpMin,
                link,
            }),
        });
    }
}

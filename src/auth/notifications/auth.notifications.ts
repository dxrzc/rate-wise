import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { EmailsService } from 'src/emails/emails.service';
import { TokensService } from 'src/tokens/tokens.service';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
} from '../constants/tokens.provider.constant';
import {
    IAccDeletionTokenPayload,
    IAccVerifTokenPayload,
} from '../interfaces/tokens-payload.interface';
import { verifyYourEmailHtml, verifyYourEmailPlainText } from '../pages/verify-your-email.page';
import {
    verifyAccountDeletionHtml,
    verifyAccountDeletionPlainText,
} from '../pages/verify-account-deletion.page';

@Injectable()
export class AuthNotifications {
    private readonly from = '"Ratewise" <no-reply@ratewise.app>';

    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accVerifToken: TokensService<IAccVerifTokenPayload>,
        @Inject(ACCOUNT_DELETION_TOKEN)
        private readonly accDeletionToken: TokensService<IAccDeletionTokenPayload>,
        private readonly emailsService: EmailsService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    private async createAccountVerificationLink(id: string) {
        const token = await this.accVerifToken.generate({ id });
        // TODO: hyphen
        return `${this.serverConfig.apiBaseUrl}/auth/verifyAccount?token=${token}`;
    }

    private async createAccountDeletionLink(id: string) {
        const token = await this.accDeletionToken.generate({ id });
        return `${this.serverConfig.apiBaseUrl}/auth/delete-account?token=${token}`;
    }

    async sendAccountVerificationEmail(user: AuthenticatedUser) {
        const subject = 'Verify your Ratewise account';
        const link = await this.createAccountVerificationLink(user.id);
        const linkExpMin = 30; // TODO: ConfigService
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

    async sendAccountDeletionEmail(user: AuthenticatedUser) {
        const subject = 'Delete your Ratewise account';
        const link = await this.createAccountDeletionLink(user.id);
        const linkExpMin = 30; // TODO: ConfigService
        await this.emailsService.sendEmail({
            from: this.from,
            to: user.email,
            subject,
            text: verifyAccountDeletionPlainText({
                username: user.username,
                linkExpMin,
                link,
            }),
            html: verifyAccountDeletionHtml({
                username: user.username,
                linkExpMin,
                link,
            }),
        });
    }
}

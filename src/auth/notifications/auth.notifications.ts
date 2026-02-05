import {
    verifyAccountDeletionHtml,
    verifyAccountDeletionPlainText,
} from '../pages/verify-account-deletion.page';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
    SIGN_OUT_ALL_TOKEN,
} from '../constants/auth.providers';
import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { verifyYourEmailHtml, verifyYourEmailPlainText } from '../pages/verify-your-email.page';
import { stringValueToMinutes } from 'src/common/functions/utils/stringvalue-to.util';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { AuthTokenService } from '../types/auth-tokens-service.type';
import { EmailsService } from 'src/emails/emails.service';
import { signOutAllHtml, signOutAllPlainText } from '../pages/sign-out-all.page';

@Injectable()
export class AuthNotifications {
    private readonly from = '"Ratewise" <no-reply@ratewise.app>';

    constructor(
        @Inject(ACCOUNT_VERIFICATION_TOKEN)
        private readonly accountVerificationToken: AuthTokenService,
        @Inject(ACCOUNT_DELETION_TOKEN)
        private readonly accountDeletionToken: AuthTokenService,
        @Inject(SIGN_OUT_ALL_TOKEN)
        private readonly signOutAllToken: AuthTokenService,
        private readonly emailsService: EmailsService,
        private readonly serverConfig: ServerConfigService,
        private readonly authConfig: AuthConfigService,
    ) {}

    private async createAccountVerificationLink(id: string) {
        const token = await this.accountVerificationToken.generate({ id });
        return `${this.serverConfig.apiBaseUrl}/auth/verify-account?token=${token}`;
    }

    private async createAccountDeletionLink(id: string) {
        const token = await this.accountDeletionToken.generate({ id });
        return `${this.serverConfig.apiBaseUrl}/auth/delete-account?token=${token}`;
    }

    private async createSignOutAllLink(id: string) {
        const token = await this.signOutAllToken.generate({ id });
        return `${this.serverConfig.apiBaseUrl}/auth/sign-out-all?token=${token}`;
    }

    async sendAccountVerificationEmail(user: AuthenticatedUser) {
        const linkExpMin = stringValueToMinutes(this.authConfig.accountVerificationTokenExp);
        const link = await this.createAccountVerificationLink(user.id);
        const subject = 'Verify your Ratewise account';
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
        const linkExpMin = stringValueToMinutes(this.authConfig.accountDeletionTokenExp);
        const link = await this.createAccountDeletionLink(user.id);
        const subject = 'Delete your Ratewise account';
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

    async sendSignOutAllEmail(user: AuthenticatedUser) {
        const linkExpMin = stringValueToMinutes(this.authConfig.signOutAllTokenExp);
        const link = await this.createSignOutAllLink(user.id);
        const subject = 'Sign out of all sessions';
        await this.emailsService.sendEmail({
            from: this.from,
            to: user.email,
            subject,
            text: signOutAllPlainText({
                username: user.username,
                linkExpMin,
                link,
            }),
            html: signOutAllHtml({
                username: user.username,
                linkExpMin,
                link,
            }),
        });
    }
}

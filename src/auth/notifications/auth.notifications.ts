import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { EmailsService } from 'src/emails/emails.service';

@Injectable()
export class AuthNotifications {
    constructor(private readonly emailsService: EmailsService) {}

    async sendAccountVerificationEmail({ username, email }: AuthenticatedUser) {
        const subject = 'Verify your Ratewise account';
        const link = 'mylink123';
        const linkExpMin = 30;
        const text = `
            Hi ${username},
            Thanks for signing up for Ratewise!
            Please verify your email address by clicking the link below:
            ${link}
            This link will expire in ${linkExpMin} minutes.
            — Ratewise
        `;
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
          <h2 style="text-align: center; color: #2563eb;">Welcome to Ratewise, ${username}!</h2>
          <p>Thanks for signing up for Ratewise! Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>This link will expire in <strong>${linkExpMin} minutes</strong>.</p>          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">          
        </div>
        `;
        await this.emailsService.sendEmail({
            from: '"Ratewise" <no-reply@ratewise.app>',
            text: text,
            html: html,
            to: email,
            subject,
        });
    }
}

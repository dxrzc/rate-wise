import * as nodemailer from 'nodemailer';
import { Inject, Injectable } from '@nestjs/common';
import { EMAILS_ROOT_OPTIONS } from '../di/emails.providers';
import { IEmailsRootOptions } from '../config/emails.root.options';
import { IEmailInfo } from '../interface/email-info.interface';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { SendSmtpEmail, TransactionalEmailsApi } from '@getbrevo/brevo';

@Injectable()
export class EmailClient {
    private readonly transporter: nodemailer.Transporter;
    private readonly emailAPI = new TransactionalEmailsApi();

    constructor(
        @Inject(EMAILS_ROOT_OPTIONS)
        private readonly options: IEmailsRootOptions,
        private readonly serverConfig: ServerConfigService,
    ) {
        this.emailAPI['authentications'].apiKey.apiKey = this.serverConfig.brevoApiKey;
        this.transporter = nodemailer.createTransport({
            host: options.smtp.host,
            port: options.smtp.port,
            secure: options.smtp.port === 465,
            auth: {
                user: options.smtp.user,
                pass: options.smtp.pass,
            },
        });
    }

    private async sendWithBrevo(options: IEmailInfo) {
        const message = new SendSmtpEmail();
        message.subject = options.subject;
        message.textContent = options.text;
        message.htmlContent = options.html;
        message.sender = { email: options.from };
        message.to = [{ email: options.to }];
        await this.emailAPI.sendTransacEmail(message);
    }

    async verifyOrThrow() {
        if (this.serverConfig.isProduction) await this.emailAPI.getSmtpTemplates();
        else await this.transporter.verify();
    }

    async sendMail(options: IEmailInfo) {
        if (this.serverConfig.isProduction) {
            await this.sendWithBrevo(options);
        } else {
            await this.transporter.sendMail({
                ...options,
            });
        }
    }
}

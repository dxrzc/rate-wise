import { SmtpConfigService } from 'src/config/services/smtp.config.service';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsClient {
    private transporter: nodemailer.Transporter;

    constructor(private readonly emailConfig: SmtpConfigService) {
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.port === 465,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });
    }

    async sendMail(options: nodemailer.SendMailOptions) {
        // TODO: what does this throw
        await this.transporter.sendMail({
            from: this.emailConfig.user,
            ...options,
        });
    }
}

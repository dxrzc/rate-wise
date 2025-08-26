import { SMTPConfigService } from 'src/config/services/smtp-config.service';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly emailConfig: SMTPConfigService) {
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
        await this.transporter.sendMail({
            from: this.emailConfig.user,
            ...options,
        });
    }
}

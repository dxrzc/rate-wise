import * as nodemailer from 'nodemailer';
import { Inject, Injectable } from '@nestjs/common';
import { EMAILS_ROOT_OPTIONS } from '../di/emails.providers';
import { IEmailsRootOptions } from '../config/emails.root.options';
import { IEmailInfo } from '../interface/email-info.interface';

@Injectable()
export class EmailClient {
    private transporter: nodemailer.Transporter;

    constructor(
        @Inject(EMAILS_ROOT_OPTIONS)
        private readonly options: IEmailsRootOptions,
    ) {
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

    verifyOrThrow() {
        return this.transporter.verify();
    }

    async sendMail(options: IEmailInfo) {
        await this.transporter.sendMail({
            ...options,
        });
    }
}

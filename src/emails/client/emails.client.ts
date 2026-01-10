import * as nodemailer from 'nodemailer';
import { IEmailInfo } from '../interface/email-info.interface';
import { Inject, Injectable } from '@nestjs/common';
import { SystemLogger } from 'src/common/logging/system.logger';
import { EMAILS_ROOT_OPTIONS } from '../constants/emails.constants';
import { IEmailsRootOptions } from '../interface/emails.root.options.interface';

@Injectable()
export class EmailsClient {
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
        try {
            await this.transporter.sendMail({
                ...options,
            });
        } catch (error) {
            SystemLogger.getInstance().error(error);
        }
    }
}

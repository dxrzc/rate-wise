import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailInfo } from '../interface/email-info.interface';
import { ISmtpConnectionOptions } from '../interface/smtp.connection.options.interface';
import { SMPT_CONNECTION_OPTIONS } from '../constants/emails.constants';

@Injectable()
export class EmailsClient implements OnModuleInit {
    private transporter: nodemailer.Transporter;

    constructor(
        @Inject(SMPT_CONNECTION_OPTIONS)
        private readonly emailOpts: ISmtpConnectionOptions,
    ) {
        this.transporter = nodemailer.createTransport({
            host: emailOpts.host,
            port: emailOpts.port,
            secure: emailOpts.port === 465,
            auth: {
                user: emailOpts.user,
                pass: emailOpts.pass,
            },
        });
    }

    async onModuleInit() {
        try {
            await this.transporter.verify();
        } catch (error) {
            // TODO: take the server down
            console.error('Smtp error:', error);
        }
    }

    async sendMail(options: IEmailInfo) {
        await this.transporter.sendMail({
            ...options,
        });
    }
}

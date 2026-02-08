import { EmailPaths } from '@e2e/enums/email-paths.enum';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

type EmailClientOptions = {
    apiPort: number;
    maxWait: number;
};

type EmaiMessage = {
    HTML: string;
    Subject: string;
    From: { Name: string; Address: string };
};

export class EmailClient {
    private readonly axiosClient: AxiosInstance;
    private readonly maxWait: number;

    constructor({ apiPort, maxWait }: EmailClientOptions = { apiPort: 8026, maxWait: 2000 }) {
        this.axiosClient = axios.create({ baseURL: `http://localhost:${apiPort}/api/v1` });
        this.maxWait = maxWait;
    }

    async getMessage(address: string): Promise<EmaiMessage | null> {
        const start = Date.now();
        let messages: { ID: string }[] | undefined;
        await new Promise((resolve) => setTimeout(resolve, 100));
        while (Date.now() - start < this.maxWait) {
            const { data } = await this.axiosClient.get(`/search?query=to%3A%22${address}%22`);
            if (data.messages_count > 0) {
                messages = data.messages;
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (!messages) return null;
        const messageId = messages[0].ID;
        const { data } = await this.axiosClient.get(`/message/${messageId}`);
        return data;
    }

    async getLinkSent(path: EmailPaths, address: string): Promise<string | null> {
        const email = await this.getMessage(address);
        if (!email?.HTML) return null;
        const $ = cheerio.load(email.HTML);
        const link = $(`a[href*="${path}"]`).first().attr('href');
        if (!link) return null;
        return link;
    }
}

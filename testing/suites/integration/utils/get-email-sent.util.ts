import axios from 'axios';
import { getMessagesToAddress } from './is-email-delivered.util';
import { getMailpitApiUrl } from './get-mailpit-api-url.util';

interface EmailData {
    meta: { Subject: string };
    message: { Text: string };
}

export async function getEmailSent(address: string): Promise<EmailData> {
    const messages = await getMessagesToAddress(address);
    if (!messages) throw new Error(`No email sent to address: ${address}`);
    const messageID = messages.at(0)!.ID;
    const api = getMailpitApiUrl();
    const message = await axios.get(`${api}/message/${messageID}`);
    return {
        meta: messages.at(0) as any,
        message: message.data,
    };
}

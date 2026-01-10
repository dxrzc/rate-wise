import axios from 'axios';
import { getMailpitApiUrl } from './get-mailpit-api-url.util';
import { sleep } from './sleep.util';

// Add a little delay and check Mailpit for an email sent to the specified address every 200ms
export async function getMessagesToAddress(address: string): Promise<{ ID: string }[] | null> {
    const maxWait = 2000;
    const start = Date.now();
    await sleep(100);
    while (Date.now() - start < maxWait) {
        const api = getMailpitApiUrl();
        const { data } = await axios.get(`${api}/search?query=to%3A%22${address}%22`);
        if (data.messages_count > 0) return data.messages;
        await sleep(200);
    }
    return null;
}

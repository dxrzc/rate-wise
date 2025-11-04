import { sleep } from '@integration/utils/sleep.util';
import type { MatcherFunction } from 'expect';
import axios from 'axios';

// Add a little delay and check Mailpit for an email sent to the specified address every 200ms
export async function waitForEmailToBeSent(address: string): Promise<boolean> {
    const maxWait = 2000;
    const start = Date.now();
    await sleep(100);
    while (Date.now() - start < maxWait) {
        const { data } = await axios.get(
            `http://localhost:${process.env.MAILPIT_API_PORT}/api/v1/search?query=to%3A%22${address}%22`,
        );
        if (data.messages_count > 0) return true;
        await sleep(200);
    }
    return false;
}

export const emailSentToThisAddress: MatcherFunction<[void]> = async function (
    untypedAddress: unknown,
) {
    const address = <string>untypedAddress;
    const pass = await waitForEmailToBeSent(address);
    return {
        pass,
        message: () =>
            pass
                ? `Expected no email to be sent to "${address}", but a message was found.`
                : `Expected an email to be sent to "${address}", but none were found.`,
    };
};

import { getMessagesToAddress } from '@integration/utils/is-email-delivered.util';
import type { MatcherFunction } from 'expect';

export const emailSentToThisAddress: MatcherFunction<[void]> = async function (
    untypedAddress: unknown,
) {
    const address = <string>untypedAddress;
    const pass = (await getMessagesToAddress(address)) !== null;
    return {
        pass,
        message: () =>
            pass
                ? `Expected no email to be sent to "${address}", but a message was found.`
                : `Expected an email to be sent to "${address}", but none were found.`,
    };
};

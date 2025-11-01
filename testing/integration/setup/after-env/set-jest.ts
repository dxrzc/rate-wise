import { expect } from '@jest/globals';
import { toContainCookie } from '@integration/custom/matchers/to-contain-cookie';
import { notToFail } from '@commontestutils/jest-matchers/not-to-fail';
import { emailSentToThisAddress } from '@integration/custom/matchers/email-sent-to-address';
import { toFailWith } from '@commontestutils/jest-matchers/to-fail-with';

expect.extend({
    toContainCookie,
    toFailWith,
    notToFail,
    emailSentToThisAddress,
});

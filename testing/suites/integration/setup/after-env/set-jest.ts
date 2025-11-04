import { expect } from '@jest/globals';
import { toContainCookie } from '@integration/custom/matchers/to-contain-cookie';
import { notToFail } from '@testing/tools/jest-matchers/not-to-fail';
import { emailSentToThisAddress } from '@integration/custom/matchers/email-sent-to-address';
import { toFailWith } from '@testing/tools/jest-matchers/to-fail-with';

expect.extend({
    toContainCookie,
    toFailWith,
    notToFail,
    emailSentToThisAddress,
});

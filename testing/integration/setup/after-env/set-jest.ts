import { expect } from '@jest/globals';
import { toContainCookie } from '@integration/custom/matchers/to-contain-cookie';
import { toFailWith } from '@integration/custom/matchers/to-fail-with';
import { notToFail } from '@integration/custom/matchers/not-to-fail';

expect.extend({
    toContainCookie,
    toFailWith,
    notToFail,
});

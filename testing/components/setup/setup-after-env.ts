import { notToFail } from '@commontestutils/jest-matchers/not-to-fail';
import { toFailWith } from '@commontestutils/jest-matchers/to-fail-with';
import { expect } from '@jest/globals';

expect.extend({
    toFailWith,
    notToFail,
});

beforeAll(() => {});

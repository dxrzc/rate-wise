import { expect } from '@jest/globals';
import { notToFail } from '@testing/tools/jest-matchers/not-to-fail';
import { toFailWith } from '@testing/tools/jest-matchers/to-fail-with';

expect.extend({
    toFailWith,
    notToFail,
});

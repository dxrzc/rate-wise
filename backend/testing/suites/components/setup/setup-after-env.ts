import { toFailWith } from '@testing/tools/jest-matchers/to-fail-with';
import { expect } from '@jest/globals';
import { notToFail } from '@testing/tools/jest-matchers/not-to-fail';

expect.extend({
    toFailWith,
    notToFail,
});

beforeAll(() => {});

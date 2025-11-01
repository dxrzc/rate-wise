import { toFailWith } from '@commontestutils/jest-matchers/to-fail-with';
import { testKit } from '@components/utils/test-kit.util';
import { expect } from '@jest/globals';
import { promises as fs } from 'fs';

expect.extend({
    toFailWith,
});

beforeAll(async () => {
    testKit.postgresUrl = await fs.readFile(
        `${process.cwd()}/testing/components/setup/postgres-uri.txt`,
        'utf8',
    );
});

import type { Config } from 'jest';
import { baseJestConfig } from './jest.base.config';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 60000,
    maxWorkers: 2,

    roots: ['<rootDir>/testing/suites/e2e/specs'],
    setupFilesAfterEnv: [
        '<rootDir>/testing/suites/e2e/setup/after-env/set-kit.ts',
        '<rootDir>/testing/suites/e2e/setup/after-env/set-jest.ts',
        '<rootDir>/testing/suites/e2e/setup/after-env/set-environment.ts',
    ],
    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@e2e/(.*)$': '<rootDir>/testing/suites/e2e/$1',
    },
};

export default config;

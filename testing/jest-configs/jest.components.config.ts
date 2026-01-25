import type { Config } from 'jest';
import { baseJestConfig } from './jest.base.config';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 20000,
    maxWorkers: '50%',

    roots: ['<rootDir>/testing/suites/components/specs'],
    globalSetup: '<rootDir>/testing/suites/components/setup/global-setup.ts',
    globalTeardown: '<rootDir>/testing/suites/components/setup/global-teardown.ts',
    setupFilesAfterEnv: ['<rootDir>/testing/suites/components/setup/setup-after-env.ts'],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/components',
    coverageProvider: 'v8',
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/testing/suites/components/**'],

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@components/(.*)$': '<rootDir>/testing/suites/components/$1',
    },
    restoreMocks: true,
};

export default config;

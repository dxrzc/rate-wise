import type { Config } from 'jest';
import { baseJestConfig } from './jest.base.config';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 30000,
    maxWorkers: 4,

    roots: ['<rootDir>/testing/suites/integration/specs'],
    globalSetup: '<rootDir>/testing/suites/integration/setup/global/setup.ts',
    globalTeardown: '<rootDir>/testing/suites/integration/setup/global/teardown.ts',
    setupFilesAfterEnv: [
        '<rootDir>/testing/suites/integration/setup/after-env/set-environment.ts',
        '<rootDir>/testing/suites/integration/setup/after-env/set-jest.ts',
        '<rootDir>/testing/suites/integration/setup/after-env/set-services.ts',
        '<rootDir>/testing/suites/integration/setup/after-env/set-app.ts',
    ],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/integration',
    coverageProvider: 'v8',
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/testing/suites/integration/**'],

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@integration/(.*)$': '<rootDir>/testing/suites/integration/$1',
    },
};

export default config;

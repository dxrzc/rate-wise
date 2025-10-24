import { baseJestConfig } from '../common/config/jest.base.config';
import type { Config } from 'jest';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 20000,
    maxWorkers: 2,

    roots: ['<rootDir>/testing/integration/specs'],
    globalSetup: '<rootDir>/testing/integration/setup/global/setup.ts',
    globalTeardown: '<rootDir>/testing/integration/setup/global/teardown.ts',
    setupFilesAfterEnv: [
        '<rootDir>/testing/integration/setup/after-env/set-environment.ts',
        '<rootDir>/testing/integration/setup/after-env/set-jest.ts',
        '<rootDir>/testing/integration/setup/after-env/set-services.ts',
        '<rootDir>/testing/integration/setup/after-env/set-app.ts',
    ],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/integration',
    coverageProvider: 'v8',
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/testing/integration/**',
    ],

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@integration/(.*)$': '<rootDir>/testing/integration/$1',
    },
};

export default config;

import { baseJestConfig } from '../utils/config/jest.base.config';
import type { Config } from 'jest';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 20000,
    maxWorkers: 2,

    roots: ['<rootDir>/testing/integration/specs'],
    globalSetup: '<rootDir>/testing/integration/config/global-setup.ts',
    globalTeardown: '<rootDir>/testing/integration/config/global-teardown.ts',
    setupFilesAfterEnv: [
        '<rootDir>/testing/integration/config/setupAfterEnv.ts',
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

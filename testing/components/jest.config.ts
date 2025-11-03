import { baseJestConfig } from '../common/config/jest.base.config';
import type { Config } from 'jest';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 20000,
    maxWorkers: '50%',

    roots: ['<rootDir>/testing/components/specs'],
    globalSetup: '<rootDir>/testing/components/setup/global-setup.ts',
    globalTeardown: '<rootDir>/testing/components/setup/global-teardown.ts',
    setupFilesAfterEnv: ['<rootDir>/testing/components/setup/setup-after-env.ts'],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/components',
    coverageProvider: 'v8',
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/testing/components/**'],

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@components/(.*)$': '<rootDir>/testing/components/$1',
    },
};

export default config;

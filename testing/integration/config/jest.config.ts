import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'jest-environment-node',
    rootDir: process.cwd(), // workidr
    preset: 'ts-jest',

    globalSetup: '<rootDir>/testing/integration/config/global-setup.ts',
    globalTeardown: '<rootDir>/testing/integration/config/global-teardown.ts',
    setupFilesAfterEnv: [
        '<rootDir>/testing/integration/config/setupAfterEnv.ts',
    ],

    // coverage
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/integration',
    coverageProvider: 'v8',

    // test files
    roots: ['<rootDir>/testing/integration/specs'],

    // aliases
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@integration/(.*)$': '<rootDir>/testing/integration/$1',
        '^@queries/(.*)$': '<rootDir>/testing/queries/$1',
        '^@test-utils/(.*)$': '<rootDir>/testing/utils/$1',
    },

    maxWorkers: '50%',
};

export default config;

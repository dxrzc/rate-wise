import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'jest-environment-node',
    rootDir: process.cwd(), // workidr
    preset: 'ts-jest',

    globalSetup: '<rootDir>/testing/e2e/config/global-setup.ts',
    globalTeardown: '<rootDir>/testing/e2e/config/global-teardown.ts',
    setupFilesAfterEnv: ['<rootDir>/testing/e2e/config/setupAfterEnv.ts'],

    // test files
    roots: ['<rootDir>/testing/e2e/specs'],

    // aliases
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@e2e/(.*)$': '<rootDir>/testing/e2e/$1',
        '^@queries/(.*)$': '<rootDir>/testing/queries/$1',
    },

    maxWorkers: '50%',
};

export default config;

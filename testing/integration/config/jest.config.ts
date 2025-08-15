import type { Config } from 'jest';

const config: Config = {
    rootDir: process.cwd(), // workidr

    globalSetup: '<rootDir>/testing/integration/config/global-setup.ts',
    globalTeardown: '<rootDir>/testing/integration/config/global-teardown.ts',

    // setup
    setupFilesAfterEnv: [
        '<rootDir>/testing/integration/config/setupAfterEnv.ts',
    ],

    // coverage
    collectCoverage: true,
    // collectCoverageFrom: [
    //     '<rootDir>/src/**/*.ts',
    //     '!<rootDir>/test/integration/**',
    // ],
    coverageDirectory: '<rootDir>/coverage/integration',
    coverageProvider: 'v8',

    // test files
    roots: ['<rootDir>/testing/integration/specs'],

    // aliases
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@integration/(.*)$': '<rootDir>/testing/integration/$1',
        '^@queries/(.*)$': '<rootDir>/testing/queries/$1',
    },

    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',

    // maxWorkers: '50%',
};

export default config;

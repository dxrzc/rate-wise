const { compilerOptions } = require('./tsconfig.json');
import { pathsToModuleNameMapper } from 'ts-jest';
import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'jest-environment-node',
    rootDir: process.cwd(), // workidr
    preset: 'ts-jest',
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

    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
    }),
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/testing/integration/tsconfig.json',
            },
        ],
    },
};

export default config;

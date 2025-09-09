import type { Config } from 'jest';

const config: Config = {
    rootDir: process.cwd(), // workidr
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/unit',
    coverageProvider: 'v8',
    roots: ['<rootDir>/testing/unit/specs'],
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@unit/(.*)$': '<rootDir>/testing/unit/$1',
    },

    maxWorkers: 2,
};

export default config;

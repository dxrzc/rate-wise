import { Config } from 'jest';

export const baseJestConfig: Config = {
    testEnvironment: 'jest-environment-node',
    rootDir: process.cwd(), // workidr
    preset: 'ts-jest',

    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@commontestutils/(.*)$': '<rootDir>/testing/utils/$1',
    },

    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/testing/tsconfig.json',
            },
        ],
    },
};

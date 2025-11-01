import { baseJestConfig } from '../common/config/jest.base.config';
import type { Config } from 'jest';

const config: Config = {
    ...baseJestConfig,
    testTimeout: 20000,
    maxWorkers: 2,

    roots: ['<rootDir>/testing/components/specs'],
    setupFilesAfterEnv: ['<rootDir>/testing/components/setup/set-jest.ts'],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/components',
    coverageProvider: 'v8',
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/testing/components/**',
    ],

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@components/(.*)$': '<rootDir>/testing/components/$1',
    },
};

export default config;

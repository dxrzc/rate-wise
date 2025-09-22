const { compilerOptions } = require('./tsconfig.json');
import { pathsToModuleNameMapper } from 'ts-jest';
import type { Config } from 'jest';

const config: Config = {
    rootDir: process.cwd(), // workidr
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/unit',
    coverageProvider: 'v8',
    roots: ['<rootDir>/testing/unit/specs'],
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/testing/unit/tsconfig.json',
            },
        ],
    },
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
    }),
    maxWorkers: 2,
};

export default config;

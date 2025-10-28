import type { Config } from 'jest';
import { baseJestConfig } from '../common/config/jest.base.config';

const config: Config = {
    ...baseJestConfig,
    maxWorkers: '50%',

    roots: ['<rootDir>/testing/unit/specs'],

    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/unit',
    coverageProvider: 'v8',

    moduleNameMapper: {
        ...baseJestConfig.moduleNameMapper,
        '^@unit/(.*)$': '<rootDir>/testing/unit/$1',
    },
};

export default config;

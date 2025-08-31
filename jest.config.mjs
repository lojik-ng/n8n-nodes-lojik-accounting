export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.(ts)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: ['**/?(*.)+(test).ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
    collectCoverageFrom: ['src/**/*.ts'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};


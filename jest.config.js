export default {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
            tsconfig: {
                module: 'es2022',
                target: 'ES2022',
                moduleResolution: 'node',
            },
        }],
    },
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};

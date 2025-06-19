/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/.vite/',
    '/dist/',
    '/coverage/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/.vite/',
    '/dist/',
    '/coverage/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        PROD: true,
        TEST: true
      }
    }
  }
}; 
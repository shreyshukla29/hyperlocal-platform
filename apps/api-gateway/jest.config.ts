import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.integration.test.ts'],

  setupFiles: ['<rootDir>/tests/setup/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],

  clearMocks: true,
  restoreMocks: true,
};

export default config;

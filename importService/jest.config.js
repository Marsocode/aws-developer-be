const path = require('path');

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
  moduleNameMapper: {
    '^/opt/nodejs/(.*)$': path.resolve(__dirname, '../common/nodejs/$1'),
  },
};

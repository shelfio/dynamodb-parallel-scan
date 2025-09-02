/**
 * @type {import('jest').Config}
 */
const config = {
  preset: '@shelf/jest-dynamodb',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  resetMocks: true,
};

export default config;

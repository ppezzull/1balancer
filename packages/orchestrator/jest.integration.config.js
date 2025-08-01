module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/integration/**/*.(test|spec).(js|ts)'],
  transform: {},
  testTimeout: 120000, // 2 minutes for integration tests
  passWithNoTests: true,
};
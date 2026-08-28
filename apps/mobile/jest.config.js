// The mobile runner is jest-expo, not Vitest: the React Native ecosystem is not reliable under Vitest
// (docs/start-roadmap.md §13). Turborepo hides the difference behind the single `test` task.

const { transformIgnorePatterns } = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  // Bun installs into an isolated store, so a package sits at `node_modules/.bun/<name>@<version>/node_modules/<name>`.
  // The preset allowlist only knows the pnpm equivalent, and the extra path segment makes it ignore React Native's own
  // ES-module sources instead of transforming them. Letting `.bun` through defers the decision to the inner
  // `node_modules/` segment, where the existing allowlist applies unchanged.
  transformIgnorePatterns: transformIgnorePatterns.map((pattern) => pattern.replace('(?!(.pnpm|', '(?!(.bun|.pnpm|')),
};

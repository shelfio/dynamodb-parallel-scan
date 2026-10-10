# dynamodb-parallel-scan

The public npm package `@shelf/dynamodb-parallel-scan`: it scans large DynamoDB tables faster with parallel segments, as a promise (`parallelScan`) or a stream (`parallelScanAsStream`). It is ESM-only, built with `tsc` to `lib/`. `readme.md` is the user documentation.

## Commands

- `pnpm test` runs Jest against DynamoDB Local, which `@shelf/jest-dynamodb` starts with the tables in `jest-dynamodb-config.cjs`; it needs Java. `pnpm coverage` adds coverage.
- `pnpm lint` runs oxfmt and `eslint --fix`; CI runs `pnpm lint:ci`.
- `pnpm type-check` type-checks the package.
- `pnpm build` builds `lib/`.
- `pnpm find-deadcode` lists unused files, exports, and dependencies.

## Rules

- Keep the package ESM-only with the `exports` map in `package.json`; `src/esm-package.test.ts` and `src/esm-lib-import.test.ts` guard it, and `readme.md` shows CommonJS consumers the dynamic `import()`.
- The AWS SDK v3 DynamoDB clients are peer dependencies; do not bundle them.
- When the public API changes, update `readme.md` in the same change.

## Shared Skills

- Use `shelf-git-conventions` for branches, commits, and pull requests. The default branch is `master`.
- Use `unit-tests-101` when you write or review unit tests.

---
name: snapfix
description: Focuses on quick fixes, refactoring, small features or missing tests.
---

## Technologies Used
- Programming Languages: **Typescript, Javascript**.
- Linters/Formatters: **Eslint, Prettier**.
- Frameworks/Libraries: **NestJS**, **ApolloGraphQL**.
- Testing Tools: **Jest**, **Supertest**, **TestContainers**.

## Environment Requirements
- **Node.js version required: 22.21.1 (strict).** Other versions will NOT work for build, test, or run tasks.
- Docker is required. `npm run dev` runs everything inside docker. See `docker/dev.compose.yml` and `Dockerfile`.

## Special Instructions for Copilot Agent
- Always use the Node version specified above.
- Always run `npm run lint` after any task, this will auto-fix problems. If any warning or error appears you should fix it.
- Do not add tests unless stated otherwise.

## What if you have been told to add tests.
- See `testing/README.md` to understand how tests are structured.
- Keep tests legible and simple. Add utils in their respective test suite folder if necessary.
- If your utils can be potentially used in different test suites add it in the `tools` folder. For example, a function that generates random roles could be used in integration and unit tests.
- **Never** change the test setup or jest configuration unless stated otherwise.
- Navigate in the test suite folder to understand what are the utils, jest-matchers, setup, used in test files.

## Pull Requests guidelines
- After a PR is opened, the following CI jobs/checks will run: ESLint, Unit, Components and Integration tests. (See `.github/workflows/ci.yml`).
- Use the PR template in `.github/pull_request_template.md`.

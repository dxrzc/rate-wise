```
testing/
├── suites/              ← All test code.
│   ├── unit/            ← Pure logic (no I/O or external deps)
│   ├── components/      ← Module, middleware, or guard tested in isolation
│   ├── integration/     ← Spins up the app and tests real endpoints (REST/GQL) using Supertest 
│   └── e2e/             ← Deployed application in k8s cluster.
├── tools/               ← Shared testing tools (mocks, fixtures, utilities) used in different test suites.
├── jest-configs/        ← Jest config files.
│── README.md            ← This file.
└── tsconfig.json        ← TypeScript configuration for test files.
```

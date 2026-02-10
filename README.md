# RateWise
GraphQL backend API for item reviews, voting and user-driven content.

## Overview
Ratewise is a backend service built with NestJS and GraphQL that allows users to create items, write reviews and vote on content.
The project focuses on GraphQL API design, cursor-based pagination, background jobs and scalable backend patterns.

## Tech Stack
- Node.js
- NestJS
- GraphQL
- PostgreSQL
- Redis
- BullMQ
- Docker

## Core Features
- GraphQL API built with NestJS, including queries and mutations for items, reviews and votes.
- Schema-driven design with strongly typed relations.
- Cursor-based pagination for scalable data access.
- Review system with user voting.
- Background jobs using BullMQ for asynchronous tasks (e.g. emails).
- Redis-based caching for frequently accessed data.
- Account management and moderation features (e.g. global sign-out, account suspension).
- Authentication and role-based authorization.

## API Documentation
This project exposes its GraphQL schema using Apollo Sandbox, providing an interactive playground to explore queries and mutations.

Although interactive GraphQL playgrounds are often restricted in production, Apollo Sandbox is intentionally exposed here to facilitate API exploration and evaluation without requiring a dedicated client.

The GraphQL endpoint is available at: `/graphql`.

## Architecture & Design
- A code-first GraphQL approach is used with NestJS, allowing the schema to be generated automatically.
- The application is structured using modular boundaries, with each domain area implemented as a dynamically configurable NestJS module using async factories.
- Feature modules are designed to be environment-agnostic, making them easy to reuse, test and reconfigure across different deployments.
- Cookie-based session authentication is used to simplify client interaction and leverage browser-native security mechanisms.
- The API is designed around user-centric workflows, prioritizing ownership-based operations (e.g. “my resources”) over system-level actions.
- Cursor-based pagination (using `createdAt` and `id`) is implemented to ensure stable and scalable access to large datasets.
- Redis is used as a shared infrastructure component for multiple concerns, including caching, background jobs, authentication-related data and rate limiting, while keeping responsibilities isolated at the module level.
- Caching is implemented at the record level and populated asynchronously using background jobs to avoid adding latency to user requests.
- BullMQ is used to offload non-blocking tasks such as email processing and cache population.
- Structured logging is implemented across the system, covering HTTP request lifecycles, GraphQL operations and infrastructure-level errors, enabling traceability and easier debugging.
- Docker is used to provide a consistent and reproducible development environment.

## How to run locally
```
git clone https://github.com/dxrzc/rate-wise.git
cd rate-wise
npm run dev
```
> [!NOTE]
> Docker must be running locally, as the project relies on Docker Compose.

## Testing
The project follows a layered testing strategy to validate behavior at different levels of the system.

- **Unit tests:** validate pure business logic in isolation, without external dependencies.
- **Component tests:** verify individual NestJS building blocks such as modules, middleware and guards in isolation.
- **Integration tests:** exercise the application through its public GraphQL endpoints using Supertest.
- **End-to-end (e2e) tests:** validate critical user flows against a fully running application in production mode.

Unit, component and integration tests are executed automatically on every pull request as part of the CI pipeline.

End-to-end (e2e) tests are executed on pull requests targeting the main branch to validate critical user flows before changes are merged.

## CI / Delivery
Docker images are built and published automatically on version tags through the CI pipeline.

## What I’d improve next
- Separate list metadata from full pagination, replacing expensive per-parent pagination with lightweight queries that can be batched via DataLoader to reduce N+1 overhead.
- Explore soft deletes to support historical data retention and moderation workflows.
- Introduce normalized categories or tags to enhance querying and content organization.
- Perform load testing to better understand performance limits under increased traffic.
- Extend account management capabilities.


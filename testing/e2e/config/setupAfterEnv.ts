import { GraphQLClient } from '../client/graphql.client';
import { e2eKit } from '../utils/e2e-kit.util';

beforeAll(() => {
    const port = process.env.SERVER_PORT || 3001;
    e2eKit.graphQLClient = new GraphQLClient(
        `http://localhost:${port}/graphql`,
    );
});

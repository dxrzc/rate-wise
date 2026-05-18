'use client';

import { HttpLink } from '@apollo/client';
import {
    ApolloNextAppProvider,
    ApolloClient,
    InMemoryCache,
} from '@apollo/client-integration-nextjs';

// TODO: envs
const API_URL = 'http://localhost:3000/graphql';

function makeClient() {
    const httpLink = new HttpLink({ uri: API_URL, credentials: 'include' });
    return new ApolloClient({
        cache: new InMemoryCache(),
        link: httpLink,
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}

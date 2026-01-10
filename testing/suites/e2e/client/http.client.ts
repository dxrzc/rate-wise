import { faker } from '@faker-js/faker';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

/**
 * - Intended to be used per test. (Same IP and same cookie jar).
 * - The "X-Forwarded-For" header works as long as the server its configured to trust the second proxy.
 * - GraphQL operations return data in a body field in order to allow compatibility with.
 * "toFailWith" and "notToFail" custom jest matchers.
 * - Axios never throws for GraphQL operations even on non-2xx responses.
 */

type GraphQlParams = {
    query: string;
    variables: Record<string, unknown>;
};

export class HttpClient {
    private readonly gqlClient: AxiosInstance;
    private readonly ip = faker.internet.ip();

    constructor() {
        const jar = new CookieJar();
        this.gqlClient = wrapper(
            axios.create({
                baseURL: `https://localhost/graphql`,
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
                jar,
            }),
        );
    }

    async graphQL(data: GraphQlParams): Promise<{ body: any }> {
        const response = await this.gqlClient.post('', data, {
            headers: { 'X-Forwarded-For': this.ip },
        });
        return { body: response.data };
    }

    async get(endpointUrl: string) {
        const response = await axios.get(endpointUrl);
        return response.data;
    }

    getNewClient(): HttpClient {
        return new HttpClient();
    }
}

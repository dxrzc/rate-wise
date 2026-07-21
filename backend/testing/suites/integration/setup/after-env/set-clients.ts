import { testKit } from '@integration/utils/test-kit.util';
import request from 'supertest';
import { faker } from '@faker-js/faker';

beforeAll(() => {
    // Returns a new a graphql request coming from a random ip address
    // on each call
    Object.defineProperty(testKit, 'gqlClient', {
        get: () =>
            request(testKit.app.getHttpServer())
                .post('/graphql')
                .set('X-Forwarded-For', faker.internet.ip()),
    });

    // Returns a new a REST request coming from a random ip address
    // on each call
    Object.defineProperty(testKit, 'restClient', {
        get: () => {
            const client = request(testKit.app.getHttpServer());
            return {
                get: (url: string) => client.get(url).set('X-Forwarded-For', faker.internet.ip()),
                post: (url: string) => client.post(url).set('X-Forwarded-For', faker.internet.ip()),
                put: (url: string) => client.put(url).set('X-Forwarded-For', faker.internet.ip()),
                delete: (url: string) =>
                    client.delete(url).set('X-Forwarded-For', faker.internet.ip()),
            };
        },
    });
});

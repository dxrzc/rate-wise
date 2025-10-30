import { Test } from 'supertest';

type HttpMethod =
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'head'
    | 'options';

export type RestClient = {
    [M in HttpMethod]: (url: string) => Test;
};

// Check how "restClient" is defined in "tesKit" to understand
// why this type is needed.

// Allowed
// testKit.restClient.get('/users').set('X-Forwarded-For', '1.2.3.4');

// Not allowed (TypeScript will error)
// testKit.restClient.set('X-Forwarded-For', '1.2.3.4').get('/users');

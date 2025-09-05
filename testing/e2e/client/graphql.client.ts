import { default as axios, AxiosInstance } from 'axios';

type AnyObj = Record<string, any>;

interface IGraphQLResponse {
    data?: AnyObj;
    errors?: { message: string; code: string }[];
}

interface IRequestResponse {
    data?: IGraphQLResponse['data'];
    error?: Exclude<IGraphQLResponse['errors'], undefined>[number];
}

export class GraphQLClient {
    private axios: AxiosInstance;

    constructor(baseURL: string) {
        this.axios = axios.create({
            baseURL,
        });
    }

    async request(query: string, input?: AnyObj): Promise<IRequestResponse> {
        const response = await this.axios.post<IGraphQLResponse>('graphql', {
            query,
            variables: { input },
        });

        return {
            data: response.data.data,
            error: response.data.errors?.at(0),
        };
    }
}

import { GraphqlErrorResponse } from '@/types/graphql/grapqhl-error.type';

export function isGraphqlErrorResponse(error: unknown): error is GraphqlErrorResponse {
    const typedError = error as unknown as GraphqlErrorResponse;
    return !!(
        error &&
        typedError.errors &&
        typedError.errors instanceof Array &&
        typedError.errors.length > 0 &&
        typedError.errors.at(0)?.code &&
        typedError.errors.at(0)?.message
    );
}

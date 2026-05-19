import { ErrorLike } from '@apollo/client';
import { isGraphqlErrorResponse } from './is-graphql-error-response.util';

export function getErrorMessage(error: ErrorLike | undefined): string {
    if (isGraphqlErrorResponse(error)) {
        const errorCode = error.errors.at(0)?.code;
        switch (errorCode) {
            case 'UNAUTHORIZED':
                return 'Invalid credentials';
            case 'TOO_MANY_REQUESTS':
                return 'Too many requests, try again later';
            default:
                return 'Unknown error';
        }
    }
    return 'A network error occurred';
}

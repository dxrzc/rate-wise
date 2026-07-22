import { ErrorLike } from '@apollo/client';
import { isGraphqlErrorResponse } from './is-graphql-error-response.util';

export function getErrorMessage(error: ErrorLike | undefined): string {
    return isGraphqlErrorResponse(error) ? error.errors.at(0)!.message : 'A network error occurred';
}

import { Catch, ExceptionFilter } from '@nestjs/common';
import { GqlHttpError } from '../errors/graphql-http.error';

/**
 * Filter to catch specific service unavailable errors and convert them to GraphQL HTTP errors.
 */
@Catch(Error)
export class ServiceUnavailableErrorFilter implements ExceptionFilter {
    catch(exception: Error) {
        if (
            exception.message ===
                "Stream isn't writeable and enableOfflineQueue options is false" ||
            exception.message === 'getaddrinfo ENOTFOUND postgres'
        ) {
            throw GqlHttpError.ServiceUnavailable();
        }
        return exception;
    }
}

import { Catch, ExceptionFilter } from '@nestjs/common';
import { GqlHttpError } from '../errors/graphql-http.error';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SystemLogger } from '../logging/system.logger';

/**
 * Filter to catch specific service unavailable errors and convert them to GraphQL HTTP errors.
 */
@Catch(Error)
export class ServiceUnavailableErrorFilter implements ExceptionFilter {
    constructor(private readonly logger: HttpLoggerService) {}

    catch(exception: Error) {
        if (
            exception.message ===
                "Stream isn't writeable and enableOfflineQueue options is false" ||
            exception.message === 'getaddrinfo ENOTFOUND postgres'
        ) {
            this.logger.error(exception.message);
            SystemLogger.getInstance().error(
                exception.message,
                exception.stack,
                ServiceUnavailableErrorFilter.name,
            );
            throw GqlHttpError.ServiceUnavailable();
        }
        return exception;
    }
}

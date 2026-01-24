import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { GraphQLError } from 'graphql';
import { convertGqlErrorToHttpError } from '../functions/error/transform-gql-error-into-http-error';
import { SystemLogger } from '../logging/system.logger';
import { COMMON_MESSAGES } from '../messages/common.messages';
import { isServiceUnavailableError } from '../functions/error/is-service-unavailable-error';
import { GqlHttpError } from '../errors/graphql-http.error';

function logException(exception: unknown) {
    if (exception instanceof Error)
        SystemLogger.getInstance().error(
            exception.message,
            exception.stack,
            'CatchEverythingFilter',
        );
    else SystemLogger.getInstance().error(exception);
}

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof Error && isServiceUnavailableError(exception)) {
            exception = GqlHttpError.ServiceUnavailable();
        }

        switch (host.getType<GqlContextType>()) {
            case 'http': {
                // After configuring Apollo, http exceptions are no longer handled automatically
                const ctx = host.switchToHttp();
                const response = ctx.getResponse<Response>();
                if (exception instanceof GraphQLError) {
                    try {
                        const { statusCode, message } = convertGqlErrorToHttpError(exception);
                        response.status(statusCode).json({ error: message });
                    } catch (error) {
                        logException(error);
                        response.status(500).json({ error: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
                    }
                    return;
                }
                if (exception instanceof HttpException) {
                    response.status(exception.getStatus()).json({ error: exception.message });
                    return;
                }
                // Unknown error
                const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                response.status(statusCode).json({ error: 'Internal server error', statusCode });
                logException(exception);
                break;
            }
            case 'graphql': {
                // This runs before Apollo formatError
                if (!(exception instanceof GraphQLError)) {
                    logException(exception);
                }
                break;
            }
            default: {
                logException(exception);
            }
        }
        return exception;
    }
}

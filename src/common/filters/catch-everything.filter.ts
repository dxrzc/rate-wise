import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GraphQLError } from 'graphql';
import { SystemLogger } from '../logging/system.logger';
import { GqlContextType } from '@nestjs/graphql';

function logException(exception: unknown) {
    if (exception instanceof Error)
        SystemLogger.getInstance().error(exception.message, exception.stack);
    else SystemLogger.getInstance().error(exception);
}

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        switch (host.getType<GqlContextType>()) {
            case 'http': {
                // After configuring Apollo, http exceptions are no longer handled automatically
                const ctx = host.switchToHttp();
                const response = ctx.getResponse<Response>();
                if (exception instanceof HttpException) {
                    response
                        .status(exception.getStatus())
                        .json(exception.getResponse());
                    return;
                }
                const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                response
                    .status(statusCode)
                    .json({ error: 'Internal server error', statusCode });
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

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { GraphQLError } from 'graphql';
import { SystemLogger } from '../logging/system.logger';
import { COMMON_MESSAGES } from '../messages/common.messages';
import { isServiceUnavailableError } from '../functions/error/is-service-unavailable-error';
import { GqlHttpError } from '../errors/graphql-http.error';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
    private logException(exception: unknown) {
        SystemLogger.getInstance().logAny(exception, CatchEverythingFilter.name);
    }

    private convertGqlErrorToHttpError(gqlError: GraphQLError) {
        const codeInExtensions = <string>gqlError.extensions.code;
        const errorCausePrefix = 'Failed to transform GraphQLError into HttpError';
        if (!codeInExtensions) throw new Error(`${errorCausePrefix}: No code provided`);
        if (!(codeInExtensions in HttpStatus)) throw new Error(`${errorCausePrefix}: Invalid code`);
        const statusCode = HttpStatus[codeInExtensions as keyof typeof HttpStatus];
        const message =
            statusCode === HttpStatus.INTERNAL_SERVER_ERROR
                ? COMMON_MESSAGES.INTERNAL_SERVER_ERROR
                : gqlError.message;
        return {
            message,
            statusCode,
        };
    }

    private normalizeGqlError(exception: unknown): unknown {
        if (exception instanceof Error && isServiceUnavailableError(exception)) {
            return GqlHttpError.ServiceUnavailable();
        }
        if (exception instanceof AggregateError) {
            exception.errors.forEach((e) => {
                this.logException(e);
            });
            return GqlHttpError.InternalServerError();
        }
        return exception;
    }

    private handleHttpContext(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        if (exception instanceof GraphQLError) {
            try {
                const { statusCode, message } = this.convertGqlErrorToHttpError(exception);
                response.status(statusCode).json({ error: message });
            } catch (error) {
                this.logException(error);
                response.status(500).json({ error: COMMON_MESSAGES.INTERNAL_SERVER_ERROR });
            }
        } else if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const message = exception.message;
            response.status(status).json({ error: message });
        } else {
            const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            response
                .status(statusCode)
                .json({ error: COMMON_MESSAGES.INTERNAL_SERVER_ERROR, statusCode });
            this.logException(exception);
        }
    }

    private handleGqlContext(exception: unknown) {
        if (!(exception instanceof GraphQLError)) {
            this.logException(exception);
        }
    }

    catch(exception: unknown, host: ArgumentsHost) {
        exception = this.normalizeGqlError(exception);
        switch (host.getType<GqlContextType>()) {
            case 'http': {
                this.handleHttpContext(exception, host);
                break;
            }
            case 'graphql': {
                // Errors are handled in gql import
                this.handleGqlContext(exception);
                break;
            }
            default: {
                this.logException(exception);
            }
        }
        return exception;
    }
}

import { HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { convertGqlErrorToHttpError } from 'src/common/functions/error/transform-gql-error-into-http-error';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

describe('convertGqlErrorToHttpError', () => {
    describe('when error.extensions.code is missing', () => {
        test('throws error when code is not provided', () => {
            const gqlError = new GraphQLError('Some error', {
                extensions: {},
            });

            expect(() => convertGqlErrorToHttpError(gqlError)).toThrow(
                'Failed to transform GraphQLError into HttpError: No code provided',
            );
        });

        test('throws error when extensions is undefined', () => {
            const gqlError = new GraphQLError('Some error');

            expect(() => convertGqlErrorToHttpError(gqlError)).toThrow(
                'Failed to transform GraphQLError into HttpError: No code provided',
            );
        });
    });

    describe('when error.extensions.code is invalid', () => {
        test('throws error for invalid status code', () => {
            const gqlError = new GraphQLError('Some error', {
                extensions: {
                    code: 'INVALID_CODE',
                },
            });

            expect(() => convertGqlErrorToHttpError(gqlError)).toThrow(
                'Failed to transform GraphQLError into HttpError: Invalid status code',
            );
        });

        test('throws error for numeric code that is not in HttpStatus', () => {
            const gqlError = new GraphQLError('Some error', {
                extensions: {
                    code: '999',
                },
            });

            expect(() => convertGqlErrorToHttpError(gqlError)).toThrow(
                'Failed to transform GraphQLError into HttpError: Invalid status code',
            );
        });
    });

    describe('when error.extensions.code is INTERNAL_SERVER_ERROR', () => {
        test('return INTERNAL_SERVER_ERROR status and generic error message', () => {
            const gqlError = new GraphQLError('Original error message', {
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            });
        });
    });

    describe('when error.extensions.code has valid HttpStatus code', () => {
        test('handle bad request code', () => {
            const gqlError = new GraphQLError('Invalid input provided', {
                extensions: {
                    code: 'BAD_REQUEST',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Invalid input provided',
                statusCode: HttpStatus.BAD_REQUEST,
            });
        });

        test('handle unauthorized code', () => {
            const gqlError = new GraphQLError('Authentication required', {
                extensions: {
                    code: 'UNAUTHORIZED',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Authentication required',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        });

        test('handle forbidden code', () => {
            const gqlError = new GraphQLError('Access denied', {
                extensions: {
                    code: 'FORBIDDEN',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Access denied',
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        test('handle not found code', () => {
            const gqlError = new GraphQLError('Resource not found', {
                extensions: {
                    code: 'NOT_FOUND',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Resource not found',
                statusCode: HttpStatus.NOT_FOUND,
            });
        });

        test('handle conflict code', () => {
            const gqlError = new GraphQLError('Resource already exists', {
                extensions: {
                    code: 'CONFLICT',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Resource already exists',
                statusCode: HttpStatus.CONFLICT,
            });
        });

        test('handle too many requests code', () => {
            const gqlError = new GraphQLError('Rate limit exceeded', {
                extensions: {
                    code: 'TOO_MANY_REQUESTS',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Rate limit exceeded',
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
            });
        });

        test('handle unprocessable entity code', () => {
            const gqlError = new GraphQLError('Unable to process entity', {
                extensions: {
                    code: 'UNPROCESSABLE_ENTITY',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Unable to process entity',
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            });
        });

        test('handle service unavailable code', () => {
            const gqlError = new GraphQLError('Service temporarily unavailable', {
                extensions: {
                    code: 'SERVICE_UNAVAILABLE',
                },
            });

            const result = convertGqlErrorToHttpError(gqlError);

            expect(result).toEqual({
                message: 'Service temporarily unavailable',
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            });
        });
    });
});

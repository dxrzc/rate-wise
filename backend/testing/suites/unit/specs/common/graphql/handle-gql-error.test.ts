import { GraphQLFormattedError } from 'graphql';
import { Code } from 'src/common/enums/code.enum';
import { handleGqlError } from 'src/common/graphql/handle-gql-error';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

describe('handleGqlError', () => {
    describe('when error.extensions.code is missing', () => {
        test('return internal server error code and error message', () => {
            const error: GraphQLFormattedError = {
                message: 'Some error occurred',
                extensions: {},
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                code: Code.INTERNAL_SERVER_ERROR,
                stackTrace: undefined,
            });
        });

        test('return internal server error when extensions is undefined', () => {
            const error: GraphQLFormattedError = {
                message: 'Some error occurred',
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                code: Code.INTERNAL_SERVER_ERROR,
                stackTrace: undefined,
            });
        });
    });

    describe('when error.extensions.code is INTERNAL_SERVER_ERROR', () => {
        test('return internal server error code and error message', () => {
            const error: GraphQLFormattedError = {
                message: 'Original error message',
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                code: Code.INTERNAL_SERVER_ERROR,
                stackTrace: undefined,
            });
        });
    });

    describe('when error.extensions.code has a custom code', () => {
        test('return the custom code and original error message', () => {
            const error: GraphQLFormattedError = {
                message: 'User not found',
                extensions: {
                    code: Code.NOT_FOUND,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'User not found',
                code: Code.NOT_FOUND,
                stackTrace: undefined,
            });
        });

        test('handle unauthorized code', () => {
            const error: GraphQLFormattedError = {
                message: 'Authentication required',
                extensions: {
                    code: Code.UNAUTHORIZED,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Authentication required',
                code: Code.UNAUTHORIZED,
                stackTrace: undefined,
            });
        });

        test('handle bad request code', () => {
            const error: GraphQLFormattedError = {
                message: 'Invalid input provided',
                extensions: {
                    code: Code.BAD_REQUEST,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Invalid input provided',
                code: Code.BAD_REQUEST,
                stackTrace: undefined,
            });
        });

        test('handle forbidden code', () => {
            const error: GraphQLFormattedError = {
                message: 'Access denied',
                extensions: {
                    code: Code.FORBIDDEN,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Access denied',
                code: Code.FORBIDDEN,
                stackTrace: undefined,
            });
        });

        test('handle conflict code', () => {
            const error: GraphQLFormattedError = {
                message: 'Resource already exists',
                extensions: {
                    code: Code.CONFLICT,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Resource already exists',
                code: Code.CONFLICT,
                stackTrace: undefined,
            });
        });

        test('handle too many requests code', () => {
            const error: GraphQLFormattedError = {
                message: 'Rate limit exceeded',
                extensions: {
                    code: Code.TOO_MANY_REQUESTS,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Rate limit exceeded',
                code: Code.TOO_MANY_REQUESTS,
                stackTrace: undefined,
            });
        });
    });

    describe('stackTrace option', () => {
        test('includes stackTrace when opts.stackTrace is true and stacktrace exists in extensions', () => {
            const stackTraceData = ['Error: test', '  at someFunction (file.ts:10:5)'];
            const error: GraphQLFormattedError = {
                message: 'Some error',
                extensions: {
                    code: Code.BAD_REQUEST,
                    stacktrace: stackTraceData,
                },
            };

            const result = handleGqlError(error, { stackTrace: true });

            expect(result).toEqual({
                message: 'Some error',
                code: Code.BAD_REQUEST,
                stackTrace: stackTraceData,
            });
        });

        test('does not include stackTrace when opts.stackTrace is false', () => {
            const stackTraceData = ['Error: test', '  at someFunction (file.ts:10:5)'];
            const error: GraphQLFormattedError = {
                message: 'Some error',
                extensions: {
                    code: Code.BAD_REQUEST,
                    stacktrace: stackTraceData,
                },
            };

            const result = handleGqlError(error, { stackTrace: false });

            expect(result).toEqual({
                message: 'Some error',
                code: Code.BAD_REQUEST,
                stackTrace: undefined,
            });
        });

        test('return undefined stackTrace when opts.stackTrace is true but no stacktrace in extensions', () => {
            const error: GraphQLFormattedError = {
                message: 'Some error',
                extensions: {
                    code: Code.BAD_REQUEST,
                },
            };

            const result = handleGqlError(error, { stackTrace: true });

            expect(result).toEqual({
                message: 'Some error',
                code: Code.BAD_REQUEST,
                stackTrace: undefined,
            });
        });

        test('does not include stackTrace when no opts provided', () => {
            const stackTraceData = ['Error: test', '  at someFunction (file.ts:10:5)'];
            const error: GraphQLFormattedError = {
                message: 'Some error',
                extensions: {
                    code: Code.BAD_REQUEST,
                    stacktrace: stackTraceData,
                },
            };

            const result = handleGqlError(error);

            expect(result).toEqual({
                message: 'Some error',
                code: Code.BAD_REQUEST,
                stackTrace: undefined,
            });
        });

        test('include stackTrace for internal server error when opts.stackTrace is true', () => {
            const stackTraceData = ['Error: internal', '  at handler (app.ts:20:10)'];
            const error: GraphQLFormattedError = {
                message: 'Original message',
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                    stacktrace: stackTraceData,
                },
            };

            const result = handleGqlError(error, { stackTrace: true });

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                code: Code.INTERNAL_SERVER_ERROR,
                stackTrace: stackTraceData,
            });
        });

        test('includes stackTrace when code is missing and opts.stackTrace is true', () => {
            const stackTraceData = ['Error: unknown', '  at somewhere (util.ts:5:2)'];
            const error: GraphQLFormattedError = {
                message: 'Unknown error',
                extensions: {
                    stacktrace: stackTraceData,
                },
            };

            const result = handleGqlError(error, { stackTrace: true });

            expect(result).toEqual({
                message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
                code: Code.INTERNAL_SERVER_ERROR,
                stackTrace: stackTraceData,
            });
        });
    });
});

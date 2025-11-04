import { GraphQLFormattedError } from 'graphql';
import { handleGqlError } from 'src/common/functions/graphql/handle-gql-error';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

describe('handleGqlError', () => {
    describe('when error.extensions.code is missing', () => {
        test('returns INTERNAL_SERVER_ERROR code and message', () => {
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

        test('returns INTERNAL_SERVER_ERROR when extensions is undefined', () => {
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
        test('returns INTERNAL_SERVER_ERROR code and message', () => {
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
        test('returns the custom code and original message', () => {
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

        test('handles UNAUTHORIZED code', () => {
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

        test('handles BAD_REQUEST code', () => {
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

        test('handles FORBIDDEN code', () => {
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

        test('handles CONFLICT code', () => {
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

        test('handles TOO_MANY_REQUESTS code', () => {
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

        test('returns undefined stackTrace when opts.stackTrace is true but no stacktrace in extensions', () => {
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

        test('includes stackTrace for INTERNAL_SERVER_ERROR when opts.stackTrace is true', () => {
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

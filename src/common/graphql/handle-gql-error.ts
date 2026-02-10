import { GraphQLFormattedError } from 'graphql';
import { Code } from 'src/common/enums/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

type ReturnedError = {
    message: string;
    code: Code;
    stackTrace: unknown;
};

export function handleGqlError(
    error: GraphQLFormattedError,
    opts?: {
        stackTrace: boolean;
    },
): ReturnedError {
    const codeInExtensions = error.extensions?.code;
    const stackTrace = opts?.stackTrace ? error.extensions?.stacktrace : undefined;

    if (!codeInExtensions) {
        return {
            message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
            code: Code.INTERNAL_SERVER_ERROR,
            stackTrace,
        };
    }

    // 'INTERNAL_SERVER_ERROR' is an Apollo built-in code if no other code is set.
    if (codeInExtensions === 'INTERNAL_SERVER_ERROR') {
        return {
            message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
            code: Code.INTERNAL_SERVER_ERROR,
            stackTrace,
        };
    }

    return {
        message: error.message,
        code: <Code>codeInExtensions,
        stackTrace,
    };
}

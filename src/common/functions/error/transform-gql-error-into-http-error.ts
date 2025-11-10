import { HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

export function convertGqlErrorToHttpError(gqlError: GraphQLError) {
    const codeInExtensions = <string>gqlError.extensions.code;
    const errorCausePrefix = 'Failed to transform GraphQLError into HttpError';

    if (!codeInExtensions) {
        throw new Error(`${errorCausePrefix}: No code provided`);
    }

    if (!(codeInExtensions in HttpStatus)) {
        throw new Error(`${errorCausePrefix}: Invalid status code`);
    }

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

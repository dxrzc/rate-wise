import { GraphQLError } from 'graphql';
import { Code } from '../enums/code.enum';
import { COMMON_MESSAGES } from '../messages/common.messages';

export class GqlHttpError {
    static BadRequest(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.BAD_REQUEST },
        });
    }

    static ServiceUnavailable() {
        return new GraphQLError('Service Unavailable', {
            extensions: { code: Code.SERVICE_UNAVAILABLE },
        });
    }

    static NotFound(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.NOT_FOUND },
        });
    }

    static Conflict(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.CONFLICT },
        });
    }

    static Unauthorized(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.UNAUTHORIZED },
        });
    }

    static Forbidden(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.FORBIDDEN },
        });
    }

    static TooManyRequests(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.TOO_MANY_REQUESTS },
        });
    }

    static InternalServerError() {
        return new GraphQLError(COMMON_MESSAGES.INTERNAL_SERVER_ERROR, {
            extensions: { code: Code.INTERNAL_SERVER_ERROR },
        });
    }
}

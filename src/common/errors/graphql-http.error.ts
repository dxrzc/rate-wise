import { GraphQLError } from 'graphql';
import { Code } from '../enum/code.enum';

export class GqlHttpError {
    static BadRequest(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.BAD_REQUEST },
        });
    }

    static NotFound(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.NOT_FOUND },
        });
    }

    static Unauthorized(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.UNAUTHORIZED },
        });
    }

    static TooManyRequests(message: string) {
        return new GraphQLError(message, {
            extensions: { code: Code.TOO_MANY_REQUESTS },
        });
    }
}

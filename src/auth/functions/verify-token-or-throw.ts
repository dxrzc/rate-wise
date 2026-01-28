import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { InvalidToken } from 'src/tokens/errors/invalid-token.error';
import { TokensService } from 'src/tokens/tokens.service';
import { AUTH_MESSAGES } from '../messages/auth.messages';
import { JwtPayload } from 'src/tokens/types/jwt-payload.type';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';

export async function verifyTokenOrThrow<T extends object>(
    tokenService: TokensService<T>,
    logger: HttpLoggerService,
    token: string,
): Promise<JwtPayload<T>> {
    try {
        return await tokenService.verify(token);
    } catch (error) {
        if (error instanceof InvalidToken) {
            logger.error(error.message);
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.INVALID_TOKEN);
        }
        logger.error(String(error));
        throw error;
    }
}

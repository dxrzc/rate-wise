import { HttpException, HttpStatus } from '@nestjs/common';
import { COMMON_MESSAGES } from '../messages/common.messages';

export class TooManyRequestsException extends HttpException {
    constructor(message: string = COMMON_MESSAGES.TOO_MANY_REQUESTS) {
        super(
            {
                error: 'Too Many Requests',
                message,
                statusCode: 429,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}

import { Injectable, ValidationPipe } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { GqlHttpError } from '../errors/graphql-http.error';
import { COMMON_MESSAGES } from '../messages/common.messages';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
    constructor(private readonly logger: HttpLoggerService) {
        super({
            whitelist: true,
            stopAtFirstError: true,
            forbidNonWhitelisted: true,
            exceptionFactory: (error) => {
                const constraints = error.at(0)?.constraints;
                if (constraints && Object.keys(constraints).length > 0) {
                    this.logger.error(Object.values(constraints).at(0)!);
                } else {
                    this.logger.error('Unexpeced validation error');
                    // TODO: system logger (full error)
                }
                throw GqlHttpError.BadRequest(COMMON_MESSAGES.INVALID_INPUT);
            },
        });
    }
}

import { ExceptionFilter, Catch } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SystemLoggerService } from 'src/system-logger/system-logger.service';

@Catch(Error)
export class CatchEverythingFiler implements ExceptionFilter {
    constructor(
        private readonly httpLogger: HttpLoggerService,
        private readonly systemLoggerService: SystemLoggerService,
    ) {}

    catch(exception: Error) {
        if (exception instanceof GraphQLError) {
            // already handled
            return exception;
        }

        this.systemLoggerService.error(exception.message, exception.stack);
        this.httpLogger.error('Internal server error');
        return exception;
    }
}

import { SystemLoggerService } from 'src/system-logger/system-logger.service';
import { Catch, ExceptionFilter } from '@nestjs/common';
import { GraphQLError } from 'graphql';

@Catch(Error)
export class CatchEverythingFilter implements ExceptionFilter {
    constructor(private readonly systemLoggerService: SystemLoggerService) {}

    catch(exception: Error) {
        if (exception instanceof GraphQLError) {
            // already handled
            return exception;
        }
        // Unknown errors
        this.systemLoggerService.error(exception.message, exception.stack);
        return exception;
    }
}

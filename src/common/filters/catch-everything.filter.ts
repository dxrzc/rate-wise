import { Catch, ExceptionFilter } from '@nestjs/common';
import { SystemLogger } from '../logging/system.logger';
import { GraphQLError } from 'graphql';

@Catch(Error)
export class CatchEverythingFilter implements ExceptionFilter {
    catch(exception: Error) {
        if (exception instanceof GraphQLError) {
            // already handled
            return exception;
        }
        // Unknown errors
        SystemLogger.getInstance().error(exception.message, exception.stack);
        return exception;
    }
}

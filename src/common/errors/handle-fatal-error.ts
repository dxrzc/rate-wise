import { NestExpressApplication } from '@nestjs/platform-express';
import { SystemLogger } from '../logging/system.logger';

const logger = SystemLogger.getInstance();
const CLEANUP_TIMEOUT = 5000;
/**
 * Cleanly shuts down the app and exits the process.
 * Includes a safety timeout
 */
export function handleFatalError(context: string, error: unknown, app?: NestExpressApplication) {
    // log
    if (error instanceof Error) logger.error(error.message, error.stack, context);
    else logger.error(String(error), undefined, context);
    // max cleanup timeout
    const timeout = setTimeout(() => {
        logger.error('Forced exit: Cleanup timed out');
        process.exit(1);
    }, CLEANUP_TIMEOUT);
    timeout.unref();
    // closing application
    if (app) {
        logger.warn('Closing Nest application...', context);
        app.close()
            .then(() => logger.warn('Application closed gracefully', context))
            .catch((err) => logger.logAnyException(err, context))
            .finally(() => process.exit(1));
    } else {
        process.exit(1);
    }
}

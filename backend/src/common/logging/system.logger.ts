import { Environment } from '../enums/environment.enum';
import { ConsoleLogger } from '@nestjs/common';
import * as winston from 'winston';

export class SystemLogger extends ConsoleLogger {
    private static fsLogger: winston.Logger;
    private static instance: SystemLogger;

    static {
        const isTesting =
            process.env.NODE_ENV !== Environment.DEVELOPMENT &&
            process.env.NODE_ENV !== Environment.PRODUCTION;

        if (isTesting) {
            // dummy transport disables logs in fs in test environment
            SystemLogger.fsLogger = winston.createLogger({
                transports: [new winston.transports.Console({ silent: true })],
            });
        } else {
            const folder =
                process.env.NODE_ENV === Environment.DEVELOPMENT ? 'logs/dev' : 'logs/prod';
            SystemLogger.fsLogger = winston.createLogger({
                transports: [
                    new winston.transports.File({
                        filename: `${folder}/system.log`,
                        format: winston.format.combine(winston.format.timestamp()),
                    }),
                ],
            });
        }
    }

    public static getInstance(): SystemLogger {
        if (!SystemLogger.instance) {
            SystemLogger.instance = new SystemLogger();
        }
        return SystemLogger.instance;
    }

    /**
     * Logs the following types of exceptions: Error, AggregateError and unknown
     * @param exception exception to log
     * @param context context where the error was thrown
     */
    logAnyException(exception: unknown, context: string) {
        if (exception instanceof Error) {
            this.error(exception.message, exception.stack, context);
        } else if (exception instanceof AggregateError) {
            exception.errors.forEach((e) => {
                this.error(e, context);
            });
        } else {
            this.error(exception);
        }
    }

    error(...args: Parameters<ConsoleLogger['error']>) {
        const [message, stack, context] = args as string[];
        SystemLogger.fsLogger.log({
            level: 'error',
            message,
            stack,
            context,
        });
        super.error(...args);
    }

    warn(...args: Parameters<ConsoleLogger['warn']>) {
        const [message, context] = args as string[];
        SystemLogger.fsLogger.log({
            level: 'warn',
            message,
            context,
        });
        super.warn(...args);
    }
}

import * as winston from 'winston';

// Avoids .log file creation
export const createDummyTransport = () => new winston.transports.Console({ silent: true });

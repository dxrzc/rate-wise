import * as winston from 'winston';

export type InfoType = winston.Logform.TransformableInfo & {
    [prop: string]: any;
};

import * as winston from 'winston';

export type InfoType = winston.Logform.TransformableInfo & {
    readonly [prop: string]: any;
};

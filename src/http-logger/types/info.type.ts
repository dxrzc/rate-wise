import * as winston from 'winston';

type CustomInfo = {
    readonly context: string;
};

export type InfoType<T = Record<string, unknown>> = winston.Logform.TransformableInfo & {
    [prop in keyof T]: T[prop];
} & Partial<CustomInfo>;

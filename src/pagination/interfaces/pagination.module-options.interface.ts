import { ObjectLiteral } from 'typeorm';

export interface IPaginationModuleOptions {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    repositoryToken: Function | string;
    transformFunction: (rawRecord: any) => ObjectLiteral;
}

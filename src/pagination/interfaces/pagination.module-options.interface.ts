import { ObjectLiteral } from 'typeorm';

export interface IPaginationModuleOptions<T = ObjectLiteral> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    repositoryToken: Function | string;
    transformFunction: (rawRecord: any) => T;
    createCacheKeyFunction: (id: string) => string;
}

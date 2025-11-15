export interface IPaginationModuleOptions {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    repositoryToken: Function | string;
    createCacheKeyFunction: (id: string) => string;
}

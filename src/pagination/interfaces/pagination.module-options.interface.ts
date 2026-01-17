export interface IPaginationModuleOptions {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    readonly repositoryToken: Function | string;
    readonly createCacheKeyFunction: (id: string) => string;
}

type GraphqlErrorData = {
    readonly message: string;
    readonly code: string;
};

export type GraphqlErrorResponse = {
    readonly errors: GraphqlErrorData[];
};

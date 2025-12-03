export interface IOperationInfo {
    operationName: string;
    argumentName: string;
    inputType: string;
    operationType?: 'mutation' | 'query';
    /**
     * Useful for the 'ALL' option in "operationFactory".
     *
     * Provide it only when a model is returned by the gql operation.
     *
     * "account" by default.
     */
    modelDataFetched?: 'account' | 'item' | 'review';
}

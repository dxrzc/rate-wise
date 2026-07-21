type AvailableModels = 'account' | 'item' | 'review';

type BaseGraphqlOperationDetails = {
    operationName: string;
    operationType: 'mutation' | 'query';
    modelDataFetched?: AvailableModels;
};

type GqlOperationDetailsWithArgs = {
    argumentName: string;
    inputType: string;
};

type GqlOperationDetailsWithoutArgs = {
    argumentName?: never;
    inputType?: never;
};

export type GqlOperationDetails = BaseGraphqlOperationDetails &
    (GqlOperationDetailsWithArgs | GqlOperationDetailsWithoutArgs);

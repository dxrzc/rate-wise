export interface GraphQLError {
    message: string;
    code: string;
    stackTrace: string;
}

export interface GraphQLErrorResponse {
    errors: GraphQLError[];
}

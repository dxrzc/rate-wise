export interface IOperationInfo {
    operationName: string;
    argumentName: string;
    inputType: string;
    operationType?: 'mutation' | 'query';
}

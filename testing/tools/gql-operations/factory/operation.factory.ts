import { IOperationInfo } from '../interfaces/operation-info.interface';
import { IOperation } from '../interfaces/operation.interface';

// TODO: This is not gonna work for items operations.
export function operationFactory(
    { operationName, inputType, argumentName, operationType = 'mutation' }: IOperationInfo,
    { args, fields }: IOperation,
) {
    let dataFetched: string;

    if (fields === 'ALL') {
        dataFetched = [
            'id',
            'createdAt',
            'updatedAt',
            'username',
            'email',
            'status',
            'roles',
            'reputationScore',
        ].join();
    } else {
        dataFetched = fields ? fields.join() : '';
    }

    return {
        query: `
               ${operationType} ($args: ${inputType}!) {
                ${operationName}(${argumentName}: $args)
                    ${fields ? `{ ${dataFetched} }` : ''}                    
              }
        `,
        variables: { args },
    };
}

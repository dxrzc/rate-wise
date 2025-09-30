import { IOperationInfo } from '../interfaces/operation-info.interface';
import { IOperation } from '../interfaces/operation.interface';

export function operationFactory(
    { operationName, inputType, argumentName }: IOperationInfo,
    { input, fields }: IOperation,
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
            'role',
            'reputationScore',
        ].join();
    } else {
        dataFetched = fields ? fields.join() : '';
    }

    return {
        query: `
               mutation ($input: ${inputType}!) {
                ${operationName}(${argumentName}: $input)
                    ${fields ? `{ ${dataFetched} }` : ''}                    
              }
        `,
        variables: { input },
    };
}

import { IOperationInfo } from '../interfaces/operation-info.interface';
import { IOperation } from '../interfaces/operation.interface';

export function operationFactory(
    { operationName, inputType, argumentName }: IOperationInfo,
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
               mutation ($args: ${inputType}!) {
                ${operationName}(${argumentName}: $args)
                    ${fields ? `{ ${dataFetched} }` : ''}                    
              }
        `,
        variables: { args },
    };
}

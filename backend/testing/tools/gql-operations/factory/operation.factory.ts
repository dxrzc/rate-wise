import { GqlOperationDetails } from '../types/gql-operation-details.type';
import { IOperation } from '../interfaces/operation.interface';
import { accountData, itemData, reviewData } from './models.data';

export function operationFactory(
    {
        operationName,
        inputType,
        argumentName,
        operationType,
        modelDataFetched,
    }: GqlOperationDetails,
    { args, fields, append = '' }: IOperation,
) {
    let dataFetched: string = '';

    if (fields === 'ALL') {
        switch (modelDataFetched) {
            case 'account':
                dataFetched = accountData.join();
                break;
            case 'item':
                dataFetched = itemData.join();
                break;
            case 'review':
                dataFetched = reviewData.join();
                break;
            default:
                dataFetched = '';
        }
    } else {
        dataFetched = fields ? fields.join() : '';
    }

    dataFetched = dataFetched + `, ${append}`;

    const query = inputType
        ? `
               ${operationType} ($args: ${inputType}!) {
                ${operationName}(${argumentName}: $args)
                    ${fields ? `{ ${dataFetched} }` : ''}                    
              }
        `
        : `
               ${operationType} {
                ${operationName}
                    ${fields ? `{ ${dataFetched} }` : ''}                    
              }
        `;

    return {
        variables: { args },
        query,
    };
}

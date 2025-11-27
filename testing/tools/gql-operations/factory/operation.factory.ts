import { IOperationInfo } from '../interfaces/operation-info.interface';
import { IOperation } from '../interfaces/operation.interface';
import { accountData, itemData, reviewData } from './models.data';

export function operationFactory(
    {
        operationName,
        inputType,
        argumentName,
        operationType = 'mutation',
        modelDataFetched = 'account',
    }: IOperationInfo,
    { args, fields }: IOperation,
) {
    let dataFetched: string;

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
                throw new Error('Invalid model');
        }
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

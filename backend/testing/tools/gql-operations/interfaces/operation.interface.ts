import { QueryFields } from '../types/query-fields.type';

/**
 * @param InputType The input type class (e.g SignUpInput)
 * @param ModelType The model type class (e.g UserModel)
 */
export interface IOperation<InputType = unknown, ModelType = any> {
    readonly args: InputType;
    readonly fields?: QueryFields<ModelType>[] | 'ALL';
    readonly append?: string;
}

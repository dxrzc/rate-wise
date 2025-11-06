import { QueryFields } from '../types/query-fields.type';

/**
 * @param InputType The input type class (e.g SignUpInput)
 * @param ModelType The model type class (e.g UserModel)
 */
export interface IOperation<InputType = unknown, ModelType = any> {
    args: InputType;
    fields?: QueryFields<ModelType>[] | 'ALL';
}

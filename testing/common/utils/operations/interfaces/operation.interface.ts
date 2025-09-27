import { QueryFields } from '../types/query-fields.type';

export interface IOperation<InputType = unknown, ModelType = any> {
    input: InputType;
    fields?: QueryFields<ModelType>[] | 'ALL';
}

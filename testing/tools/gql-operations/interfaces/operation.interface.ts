import { QueryFields } from '../types/query-fields.type';

export interface IOperation<InputType = unknown, ModelType = any> {
    args: InputType;
    fields?: QueryFields<ModelType>[] | 'ALL';
}

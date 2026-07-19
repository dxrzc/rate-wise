/**
 * Query field can only contain existing field names of the model as strings
 *  e.g when T = UserModel, then a query field can be 'id', 'username', etc.
 */
export type QueryFields<T> = Extract<keyof T, string>;

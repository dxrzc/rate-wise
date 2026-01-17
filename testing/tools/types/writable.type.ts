export type Writable<T> = {
    -readonly [prop in keyof T]: T[prop];
};

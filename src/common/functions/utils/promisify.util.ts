export const promisify = <T = void>(
    fn: (callback: (err?: Error, result?: T) => void) => void,
) => {
    return new Promise<T>((resolve, reject) => {
        fn((err, result) => {
            if (err) reject(err);
            else resolve(result as T);
        });
    });
};

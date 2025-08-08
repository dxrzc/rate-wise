export function rethrowIfFails(promise: Promise<unknown>) {
    promise.catch((err) => {
        throw err;
    });
}

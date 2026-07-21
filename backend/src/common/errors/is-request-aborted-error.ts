export function isRequestAbortedError(error: Error) {
    return error.message === 'request aborted';
}

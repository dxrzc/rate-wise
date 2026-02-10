export function isServiceUnavailableError(exception: Error) {
    if (
        exception.message === "Stream isn't writeable and enableOfflineQueue options is false" ||
        exception.message === 'getaddrinfo ENOTFOUND postgres'
    ) {
        return true;
    }
}

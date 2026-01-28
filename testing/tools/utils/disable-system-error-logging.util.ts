import { SystemLogger } from 'src/common/logging/system.logger';

/**
 * Use it whenever an internal server error occurs intentionally.
 */
export function disableSystemErrorLoggingForThisTest() {
    jest.spyOn(SystemLogger.getInstance(), 'error').mockImplementationOnce(() => {});
}

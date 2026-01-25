import { SystemLogger } from 'src/common/logging/system.logger';

export function disableSystemErrorLoggingForThisTest() {
    jest.spyOn(SystemLogger.getInstance(), 'error').mockImplementationOnce(() => {});
}

import { SilentHttpLogger } from '@components/utils/silent-http-logger.util';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

export function createDisabledLoggerImport() {
    return [
        HttpLoggerModule.forRootAsync({
            useClass: SilentHttpLogger,
        }),
        HttpLoggerModule.forFeature({ context: 'test' }),
    ];
}

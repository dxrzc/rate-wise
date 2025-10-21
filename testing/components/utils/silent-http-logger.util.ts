import { DynamicModule } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

export function createSilentHttpLogger(): DynamicModule {
    return HttpLoggerModule.forRootAsync({
        useFactory: () => ({
            messages: {
                console: { silent: true },
                filesystem: {
                    silent: true,
                },
            },
            requests: {
                silent: true,
            },
        }),
    });
}

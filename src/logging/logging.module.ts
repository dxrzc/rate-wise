import { HttpLoggerService } from './http/http-logger.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [HttpLoggerService],
    exports: [HttpLoggerService],
})
export class LoggingModule {}

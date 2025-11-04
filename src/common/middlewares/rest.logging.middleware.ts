import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RestLoggingMiddleware implements NestMiddleware {
    constructor(
        private readonly logger: HttpLoggerService,
        private readonly cls: ClsService,
    ) {}

    use(req: Request, res: Response, next: NextFunction) {
        const reqIp = req.ip!;
        const reqId = uuidv4();
        const startTime = Date.now();

        // Used in future logs
        this.cls.set('ip', reqIp);
        this.cls.set('requestId', reqId);

        res.on('finish', () => {
            const duration = Date.now() - startTime;
            this.logger.info(`Request completed (${duration}ms)`);
            this.logger.logREST({
                responseTime: `${duration}ms`,
                requestId: reqId,
                endpoint: req.originalUrl,
                ip: reqIp,
            });
        });

        next();
    }
}

import { ServerConfigService } from 'src/config/services/server-config.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashingService {
    constructor(private readonly serverConfig: ServerConfigService) {}

    hash(data: string): string {
        const salt = bcrypt.genSaltSync(this.serverConfig.bcryptSaltRounds);
        return bcrypt.hashSync(data, salt);
    }

    compare(data: string, hash: string): boolean {
        return bcrypt.compareSync(data, hash);
    }
}

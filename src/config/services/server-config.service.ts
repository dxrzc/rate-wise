import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '../interface/service-config.interface';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enum/environment.enum';

@Injectable()
export class ServerConfigService {
    constructor(
        private readonly configService: ConfigService<IServerConfig, true>,
    ) {}

    get bcryptSaltRounds(): number {
        return this.configService.get('BCRYPT_SALT_ROUNDS');
    }

    get environment(): Environment {
        return this.configService.get('NODE_ENV');
    }

    get port(): number {
        return this.configService.get('PORT');
    }
}

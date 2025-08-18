import { Environment } from 'src/common/enum/environment.enum';

export interface IServerConfig {
    NODE_ENV: Environment;
    PORT: number;
    BCRYPT_SALT_ROUNDS: number;
}

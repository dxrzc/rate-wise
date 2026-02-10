import { config } from 'dotenv';
import { Environment } from 'src/common/enums/environment.enum';

config({ path: `${process.cwd()}/.env.defaults` });
config({ path: `${process.cwd()}/.env.test`, override: true });
process.env.NODE_ENV = Environment.INTEGRATION;

import { config } from 'dotenv';
import { Environment } from 'src/common/enum/environment.enum';

config({ path: '.env.test' });
process.env.NODE_ENV = Environment.INTEGRATION;

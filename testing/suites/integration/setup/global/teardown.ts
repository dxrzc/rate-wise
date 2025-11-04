import { promises as fs } from 'fs';
import { SERVICES_CONFIG_FILE_PATH } from './constants/services-config-file-path.constant';

export default async function () {
    try {
        await fs.rm(SERVICES_CONFIG_FILE_PATH);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

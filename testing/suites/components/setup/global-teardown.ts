import { promises as fs } from 'fs';
import { join } from 'path';

export default async function () {
    await fs.rm(join(__dirname, 'postgres-uri.txt'));
}

import { promises as fs } from 'fs';
import { join } from 'path';

export async function deleteFile(path: string) {
    await fs.rm(join(__dirname, path), {
        force: true,
    });
}

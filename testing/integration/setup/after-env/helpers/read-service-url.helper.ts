import { promises as fs } from 'fs';

export async function readSvcConnection(service: string): Promise<string> {
    const url = await fs.readFile(
        `${process.cwd()}/testing/integration/setup/global/containers/${service}.txt`,
        'utf8',
    );
    return url;
}

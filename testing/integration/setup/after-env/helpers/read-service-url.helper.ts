import { promises as fs } from 'fs';

export async function readServiceURL(service: string): Promise<string> {
    const url = await fs.readFile(
        `${process.cwd()}/testing/integration/setup/global/containers/${service}-uri.txt`,
        'utf8',
    );
    return url;
}

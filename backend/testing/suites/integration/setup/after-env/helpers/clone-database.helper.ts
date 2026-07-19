import { DataSource } from 'typeorm';

export async function cloneDatabase(templateDbUri: string): Promise<string> {
    // use default "postgres" db
    const systemUri = templateDbUri.replace(/\/[^/]+$/, '/postgres');
    const templateDb = templateDbUri.slice(templateDbUri.lastIndexOf('/') + 1);
    const sysDs = await new DataSource({
        type: 'postgres',
        url: systemUri,
    }).initialize();

    // clone database
    const testDb = `ratewise${Date.now()}`;
    await sysDs.query(`CREATE DATABASE ${testDb} TEMPLATE ${templateDb};`);
    await sysDs.destroy();

    // return uri to new database
    return templateDbUri.replace(/\/[^/]+$/, `/${testDb}`);
}

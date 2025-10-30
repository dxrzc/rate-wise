import { GenericContainer } from 'testcontainers';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function createMailpit() {
    const mailpitContainer = await new GenericContainer(
        'axllent/mailpit:v1.27.6',
    )
        .withExposedPorts(1025)
        .withExposedPorts(8025)
        .start();
    const mailerPort = mailpitContainer.getMappedPort(1025);
    const apiPort = mailpitContainer.getMappedPort(8025);
    await Promise.all([
        fs.writeFile(join(__dirname, `mailpit-port.txt`), String(mailerPort)),
        fs.writeFile(join(__dirname, `mailpit-api-port.txt`), String(apiPort)),
    ]);
}

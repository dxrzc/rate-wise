import { GenericContainer } from 'testcontainers';

export async function createMailpit() {
    const mailpitContainer = await new GenericContainer(
        'axllent/mailpit:v1.27.6',
    )
        .withExposedPorts(1025)
        .withExposedPorts(8025)
        .start();
    const smtpPort = mailpitContainer.getMappedPort(1025);
    const apiPort = mailpitContainer.getMappedPort(8025);
    return { smtpPort, apiPort };
}

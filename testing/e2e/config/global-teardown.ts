import { StartedDockerComposeEnvironment } from 'testcontainers';

export default async function () {
    await (globalThis.environment as StartedDockerComposeEnvironment).down();
}

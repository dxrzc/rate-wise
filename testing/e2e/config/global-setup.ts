import { DockerComposeEnvironment } from 'testcontainers';

const composeFilePath = process.cwd();
const composeFile = 'docker/e2e.compose.yml';

export default async function () {
    const environment = await new DockerComposeEnvironment(
        composeFilePath,
        composeFile,
    )
        .withBuild()
        .up();

    globalThis.environment = environment;
}

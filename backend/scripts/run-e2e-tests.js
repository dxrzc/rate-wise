const { execa } = require('execa');

const userArgs = process.argv.slice(2);

(async () => {
    try {
        const { stdout: stdoutDockerfile } = await execa(
            'docker',
            [
                'compose',
                '-f',
                'docker/base.compose.yml',
                '-f',
                'docker/e2e.compose.yml',
                'up',
                '--wait',
                '--build',
            ],
            { stdio: 'inherit' },
        );
        console.log({ stdoutDockerfile });

        const { stdout } = await execa(
            'jest',
            ['--config', 'testing/jest-configs/jest.e2e.config.ts', ...userArgs],
            {
                env: {
                    NODE_TLS_REJECT_UNAUTHORIZED: '0',
                    NODE_OPTIONS: '--no-warnings',
                }, // Disables TLS certificate validation
                stdio: 'inherit',
            },
        );
        console.log(stdout);
    } finally {
        await execa(
            'docker',
            [
                'compose',
                '-f',
                'docker/base.compose.yml',
                '-f',
                'docker/e2e.compose.yml',
                'down',
                '--volumes',
            ],
            { stdio: 'inherit' },
        );
    }
})();

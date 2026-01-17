const { execa } = require('execa');

const userArgs = process.argv.slice(2);

(async () => {
    try {
        await execa(
            'docker',
            ['compose', '-f', 'docker/base.compose.yml', '-f', 'docker/e2e.compose.yml', 'up', '--wait', '--build'],
            { stdio: 'inherit' }
        );

        await execa(
            'jest',
            ['--config', 'testing/jest-configs/jest.e2e.config.ts', ...userArgs],
            {
                env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' }, // Disables TLS certificate validation
                stdio: 'inherit'
            }
        );

    } finally {
        await execa(
            'docker',
            ['compose', '-f', 'docker/base.compose.yml', '-f', 'docker/e2e.compose.yml', 'down', '--volumes'],
            { stdio: 'inherit' }
        );
    }
})();
const { execa } = require('execa');

(async () => {
    try {
        await execa(
            'docker',
            ['compose', '-f', 'docker/base.compose.yml', '-f', 'docker/e2e.compose.yml', 'up', '--wait', '--build'],
            { stdio: 'inherit' }
        );

        await execa(
            'jest',
            ['--config', 'testing/jest-configs/jest.e2e.config.ts'],
            {
                env: {
                    NODE_TLS_REJECT_UNAUTHORIZED: '0',
                    NODE_OPTIONS: '--no-warnings',
                }, // Disables TLS certificate validation
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
import * as compose from 'docker-compose';
import * as path from 'path';

export default async function () {
    await compose.downMany(global.services as string[], {
        log: true,
        cwd: path.join(__dirname),
    });
}

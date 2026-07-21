import { CacheModule } from '@nestjs/cache-manager';

export function createCacheImport() {
    // in memory by default
    return [CacheModule.register({ isGlobal: true })];
}

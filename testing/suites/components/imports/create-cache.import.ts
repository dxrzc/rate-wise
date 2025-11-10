import { CacheModule } from '@nestjs/cache-manager';

export function createCacheImport() {
    return [CacheModule.register({ isGlobal: true })];
}

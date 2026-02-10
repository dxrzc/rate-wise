import { Module } from '@nestjs/common';
import { ModerationResolver } from './moderation.resolver';
import { ModerationService } from './moderation.service';
import { UsersModule } from 'src/users/users.module';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [UsersModule, HttpLoggerModule.forFeature({ context: 'moderation' })],
    providers: [ModerationResolver, ModerationService],
})
export class ModerationModule {}

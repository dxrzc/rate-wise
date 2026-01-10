import { Module } from '@nestjs/common';
import { UserDeletionService } from './user-deletion.service';
import { UsersModule } from 'src/users/users.module';
import { VotesModule } from 'src/votes/votes.module';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [
        UsersModule,
        VotesModule,
        HttpLoggerModule.forFeature({ context: UserDeletionService.name }),
    ],
    providers: [UserDeletionService],
    exports: [UserDeletionService],
})
export class UserDeletionModule {}

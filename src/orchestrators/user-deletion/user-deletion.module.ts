import { Module } from '@nestjs/common';
import { UserDeletionService } from './user-deletion.service';
import { UsersModule } from 'src/users/users.module';
import { VotesModule } from 'src/votes/votes.module';

@Module({
    imports: [UsersModule, VotesModule],
    providers: [UserDeletionService],
    exports: [UserDeletionService],
})
export class UserDeletionModule {}

import { Injectable } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { UsersService } from 'src/users/users.service';
import { VotesService } from 'src/votes/votes.service';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class UserDeletionService {
    constructor(
        private readonly userService: UsersService,
        private readonly votesService: VotesService,
        private readonly dataSource: DataSource,
        private readonly loggerService: HttpLoggerService,
    ) {}

    async deleteOne(id: string): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            const user = await this.userService.findOneByIdOrThrowTx(id, manager);
            await this.votesService.subtractUserVotesFromReviews(id, manager);
            await this.userService.deleteOneTx(user, manager);
        });
        await this.userService.deleteUserFromCache(id);
        this.loggerService.info(`User ${id} has been deleted from database and cache.`);
        this.loggerService.info(`User ${id} votes have been subtracted from reviews.`);
    }
}

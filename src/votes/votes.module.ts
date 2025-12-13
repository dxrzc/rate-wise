import { forwardRef, Module } from '@nestjs/common';
import { VotesResolver } from './votes.resolver';
import { VotesService } from './votes.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { createVoteCacheKey } from './cache/create-cache-key';

@Module({
    imports: [
        TypeOrmModule.forFeature([Vote]),
        HttpLoggerModule.forFeature({ context: 'votes' }),
        forwardRef(() => ReviewsModule),
        PaginationModule.register({
            createCacheKeyFunction: createVoteCacheKey,
            repositoryToken: getRepositoryToken(Vote),
        }),
    ],
    providers: [VotesResolver, VotesService],
    exports: [VotesService],
})
export class VotesModule {}

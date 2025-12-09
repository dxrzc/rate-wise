import { Module } from '@nestjs/common';
import { VotesResolver } from './votes.resolver';
import { VotesService } from './votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { ReviewsModule } from 'src/reviews/reviews.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Vote]),
        HttpLoggerModule.forFeature({ context: 'votes' }),
        ReviewsModule,
    ],
    providers: [VotesResolver, VotesService],
})
export class VotesModule {}

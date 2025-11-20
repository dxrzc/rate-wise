import { Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { DateScalar } from './graphql/scalars/date-scalar.scalar';

@Module({
    providers: [HashingService, DateScalar],
    exports: [HashingService],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { DateScalar } from './graphql/date-scalar.scalar';

@Module({
    providers: [DateScalar],
    exports: [],
})
export class CommonModule {}

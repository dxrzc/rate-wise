import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { CommonModule } from 'src/common/common.module';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { AdminInitService } from './services/admin-init.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        CommonModule,
        HttpLoggerModule.forFeature({ context: AdminInitService.name }),
    ],
    providers: [AdminInitService],
})
export class AdminModule {}

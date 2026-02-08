import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { AdminInitService } from './admin.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        AuthModule,
        HttpLoggerModule.forFeature({ context: AdminInitService.name }),
    ],
    providers: [AdminInitService],
})
export class AdminModule {}

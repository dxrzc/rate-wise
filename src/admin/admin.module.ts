import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { AdminService } from './admin.service';
import { SecurityModule } from 'src/security/security.module';
import { SeedModule } from 'src/seed/seed.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SecurityModule,
        HttpLoggerModule.forFeature({ context: AdminService.name }),
        SeedModule,
    ],
    providers: [AdminService],
})
export class AdminModule {}

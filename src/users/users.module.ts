import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        HttpLoggerModule.forFeature({ context: UsersService.name }),
    ],
    providers: [UsersResolver, UsersService],
    exports: [UsersService],
})
export class UsersModule {}

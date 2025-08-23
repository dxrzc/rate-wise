import { LoggingModule } from 'src/logging/logging.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';

@Module({
    imports: [TypeOrmModule.forFeature([User]), LoggingModule],
    providers: [UsersResolver, UsersService],
    exports: [UsersService],
})
export class UsersModule {}

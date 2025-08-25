import { Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { EmailService } from './services/email.service';

@Module({
    providers: [HashingService, EmailService],
    exports: [HashingService, EmailService],
})
export class CommonModule {}

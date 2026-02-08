import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { AdminConfigService } from 'src/config/services/admin.config.service';
import { SystemLogger } from 'src/common/logging/system.logger';
import { HashingService } from 'src/security/hashing.service';

@Injectable()
export class AdminInitService implements OnModuleInit {
    private readonly sysLogger = SystemLogger.getInstance();

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly adminConfig: AdminConfigService,
        private readonly hashingService: HashingService,
    ) {}

    async onModuleInit() {
        await this.createAdminIfNotExists();
    }

    private async createAdminIfNotExists(): Promise<void> {
        try {
            const adminEmail = this.adminConfig.email;
            const existingAdmin = await this.userRepository.findOne({
                where: { email: adminEmail },
            });
            if (existingAdmin) {
                this.sysLogger.log(`Admin "${adminEmail}" already exists, skipping creation.`);
                return;
            }
            const adminUser = this.userRepository.create({
                username: this.adminConfig.username,
                email: adminEmail,
                passwordHash: await this.hashingService.hash(this.adminConfig.password),
                roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.CREATOR, UserRole.REVIEWER],
                status: AccountStatus.ACTIVE,
            });
            await this.userRepository.save(adminUser);
            this.sysLogger.log(`Admin user created successfully with email: ${adminEmail}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.sysLogger.log(`Failed to create admin user: ${errorMessage}`);
            throw error;
        }
    }
}

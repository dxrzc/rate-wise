import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { AdminConfigService } from 'src/config/services/admin.config.service';
import { SystemLogger } from 'src/common/logging/system.logger';
import { HashingService } from 'src/security/hashing.service';
import { SeedService } from 'src/seed/seed.service';
import { ServerConfigService } from 'src/config/services/server.config.service';

@Injectable()
export class AdminService implements OnModuleInit {
    private readonly sysLogger = SystemLogger.getInstance();

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly adminConfig: AdminConfigService,
        private readonly hashingService: HashingService,
        private readonly seedService: SeedService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    async onModuleInit() {
        await this.createAdminIfNotExists();
        await this.seedProd();
    }

    async seedProd() {
        if (this.serverConfig.isProduction) {
            await this.seedService.runSeed({
                USERS: 4,
                ITEMS_PER_USER: 2,
                MAX_REVIEWS: 5,
                MAX_VOTES: 5,
            });
            this.sysLogger.log('Seed executed successfully');
        }
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

import { testKit } from '@components/utils/test-kit.util';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';

export function createTypeormImport(postgresUrl = testKit.postgresUrl) {
    return [
        TypeOrmModule.forRoot({
            url: postgresUrl,
            autoLoadEntities: false,
            synchronize: true,
            entities: [User, Item],
            type: 'postgres',
            retryDelay: 1000,
            retryAttempts: 3,
        }),
    ];
}

import { BaseEntity } from 'src/common/entites/base.entity';
import { Item } from 'src/items/entities/item.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserRole } from '../enum/user-role.enum';
import { UserStatus } from '../enum/user-status.enum';

@Entity('account')
export class User extends BaseEntity {
    @Column({ type: 'varchar', unique: true, length: 30 })
    username!: string;

    @Column({ type: 'varchar', unique: true, length: 45 })
    email!: string;

    @Column({ type: 'varchar', length: 60 })
    password!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        enumName: 'account_role_enum',
        default: UserRole.USER,
    })
    role!: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        enumName: 'account_status_enum',
        default: UserStatus.PENDING_VERIFICATION,
    })
    status!: UserStatus;

    @Column('integer', { default: 0, name: 'reputation_score' })
    reputationScore!: number;

    @OneToMany(() => Item, (item) => item.user)
    items?: Item[];
}

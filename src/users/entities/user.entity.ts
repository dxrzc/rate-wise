import { UserRole } from 'src/common/enums/user-role.enum';
import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Item } from 'src/items/entities/item.entity';

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
        default: UserRole.USER,
    })
    role!: string;

    @Column('integer', { default: 0, name: 'reputation_score' })
    reputationScore!: number;

    @OneToMany(() => Item, (item) => item.user)
    items?: Item[];
}

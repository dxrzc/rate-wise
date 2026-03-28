import { BaseEntity } from 'src/common/entites/base.entity';
import { Item } from 'src/items/entities/item.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { Review } from 'src/reviews/entities/review.entity';
import { Vote } from 'src/votes/entities/vote.entity';

@Entity('account')
export class User extends BaseEntity {
    @Column({ type: 'text' })
    username!: string;

    @Column({ type: 'text' })
    email!: string;

    @Column({ type: 'text', name: 'password_hash' })
    passwordHash!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        enumName: 'account_roles',
        default: [UserRole.REVIEWER, UserRole.CREATOR],
        array: true,
    })
    roles!: UserRole[];

    @Column({
        type: 'enum',
        enum: AccountStatus,
        enumName: 'account_statuses',
        default: AccountStatus.PENDING_VERIFICATION,
    })
    status!: AccountStatus;

    @OneToMany(() => Item, (item) => item.user)
    items!: Item[];

    @OneToMany(() => Review, (review) => review.user)
    reviews!: Review[];

    @OneToMany(() => Vote, (vote) => vote.user)
    votes!: Vote[];
}

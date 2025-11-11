import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

// TODO: use constants
@Entity()
export class Item extends BaseEntity {
    @Column('varchar', {
        unique: true,
        length: 40,
    })
    title!: string;

    @Column('text')
    description!: string;

    @Column('varchar', { length: 40 })
    category!: string;

    @Column('varchar', {
        array: true,
        length: 20,
    })
    tags!: string[];

    @Column('numeric', {
        name: 'average_rating',
        precision: 3,
        scale: 2,
        default: 0,
    })
    averageRating!: number;

    @Column('integer', {
        name: 'review_count',
        default: 0,
    })
    reviewCount!: number;

    @ManyToOne(() => User, (user) => user.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'account_id',
        foreignKeyConstraintName: 'FK_item_account_id',
    })
    user!: User;
}

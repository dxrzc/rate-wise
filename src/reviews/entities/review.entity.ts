import { BaseEntity } from 'src/common/entites/base.entity';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Review extends BaseEntity {
    @Column('text')
    content!: string;

    @Column('integer', { default: 0 })
    rating!: number; // 0–10 enforced by DB

    @Column('integer', { default: 0 })
    votes!: number;

    @ManyToOne(() => User, (user) => user.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'account_id' })
    user!: User;

    @ManyToOne(() => Item, (item) => item.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'item_id' })
    item!: Item;

    @Column({ name: 'account_id' })
    createdBy!: string;

    @Column({ name: 'item_id' })
    relatedItem!: string;
}

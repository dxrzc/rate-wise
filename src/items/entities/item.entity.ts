import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ITEM_RULES } from '../policy/items.rules';
import { Review } from 'src/reviews/entities/review.entity';

@Entity()
export class Item extends BaseEntity {
    @Column('varchar', {
        unique: true,
        length: ITEM_RULES.TITLE.MAX,
    })
    title!: string;

    @Column('text')
    description!: string;

    @Column('varchar', { length: ITEM_RULES.CATEGORY.MAX })
    category!: string;

    @Column('varchar', {
        array: true,
        length: ITEM_RULES.TAGS.TAG_MAX_LENGTH,
    })
    tags!: string[];

    @OneToMany(() => Review, (review) => review.item)
    reviews!: Review[];

    @ManyToOne(() => User, (user) => user.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'account_id' })
    user!: User;

    @Column({ name: 'account_id' })
    createdBy!: string;
}

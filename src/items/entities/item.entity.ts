import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ITEMS_LIMITS } from '../constants/items.constants';
import { Review } from 'src/reviews/entities/review.entity';

@Entity()
export class Item extends BaseEntity {
    @Column('varchar', {
        unique: true,
        length: ITEMS_LIMITS.TITLE.MAX,
    })
    title!: string;

    @Column('text')
    description!: string;

    @Column('varchar', { length: ITEMS_LIMITS.CATEGORY.MAX })
    category!: string;

    @Column('varchar', {
        array: true,
        length: ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH,
    })
    tags!: string[];

    @Column('numeric', {
        name: 'average_rating',
        precision: 3,
        scale: 1,
        default: 0,
    })
    averageRating!: number;

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

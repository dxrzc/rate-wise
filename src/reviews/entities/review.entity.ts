import { BaseEntity } from 'src/common/entites/base.entity';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Vote } from 'src/votes/entities/vote.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Review extends BaseEntity {
    @Column('text')
    content!: string;

    @Column('integer')
    rating!: number;

    @Column('integer', { name: 'upvotes' })
    upVotes!: number;

    @Column('integer', { name: 'downvotes' })
    downVotes!: number;

    @ManyToOne(() => User, (user) => user.reviews)
    @JoinColumn({ name: 'created_by' })
    user!: User;

    @Column({ name: 'created_by' })
    createdBy!: string;

    @ManyToOne(() => Item, (item) => item.reviews)
    @JoinColumn({ name: 'related_item' })
    item!: Item;

    @Column({ name: 'related_item' })
    relatedItem!: string;

    @OneToMany(() => Vote, (vote) => vote.review)
    votes!: Vote[];
}

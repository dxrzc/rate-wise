import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Review } from 'src/reviews/entities/review.entity';
import { customArrayTransformer } from 'src/common/db/transformers/array.transformer';

@Entity()
export class Item extends BaseEntity {
    @Column('text')
    title!: string;

    @Column('text')
    description!: string;

    @Column('text')
    category!: string;

    @Column('text', { array: true, transformer: customArrayTransformer })
    tags!: string[];

    @OneToMany(() => Review, (review) => review.item)
    reviews!: Review[];

    @ManyToOne(() => User, (user) => user.items, {})
    @JoinColumn({ name: 'created_by' })
    user!: User;

    @Column({ name: 'created_by' })
    createdBy!: string;
}

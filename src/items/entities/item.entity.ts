import { BaseEntity } from 'src/common/entites/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Item extends BaseEntity {
    @Column('varchar', { length: 40 })
    title!: string;

    @Column('text')
    description!: string;

    @Column('varchar', { length: 40 })
    category!: string;

    @Column('varchar', { array: true, length: 20 })
    tags!: string[];

    @Column('numeric', {
        name: 'average_rating',
        precision: 3,
        scale: 2,
        default: 0,
    })
    averageRating!: number;

    @Column('integer', { name: 'review_count', default: 0 })
    reviewCount!: number;
}

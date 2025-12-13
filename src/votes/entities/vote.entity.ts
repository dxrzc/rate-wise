import { BaseEntity } from 'src/common/entites/base.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { VoteAction } from '../enum/vote.enum';

@Entity()
export class Vote extends BaseEntity {
    @Column({ type: 'enum', enum: VoteAction })
    vote!: VoteAction;

    @ManyToOne(() => Review, (review) => review.votes, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'review_id' })
    review!: Review;

    @ManyToOne(() => User, (user) => user.votes, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'account_id' })
    user!: User;

    @Column({ name: 'account_id' })
    createdBy!: string;

    @Column({ name: 'review_id' })
    relatedReview!: string;
}

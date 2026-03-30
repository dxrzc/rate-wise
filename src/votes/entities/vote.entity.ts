import { BaseEntity } from 'src/common/entites/base.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { VoteAction } from '../enum/vote.enum';

@Entity()
export class Vote extends BaseEntity {
    @Column({ type: 'enum', enum: VoteAction })
    vote!: VoteAction;

    @ManyToOne(() => Review, (review) => review.votes)
    @JoinColumn({ name: 'related_review' })
    review!: Review;

    @Column({ name: 'related_review' })
    relatedReview!: string;

    @ManyToOne(() => User, (user) => user.votes)
    @JoinColumn({ name: 'created_by' })
    user!: User;

    @Column({ name: 'created_by' })
    createdBy!: string;
}

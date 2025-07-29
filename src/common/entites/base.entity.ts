import { CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity()
export abstract class BaseEntity {
    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

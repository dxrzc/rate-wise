import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaginationIndexes1764716490373 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX account_idx_created_id ON account (created_at, id)`);
        await queryRunner.query(`CREATE INDEX item_idx_created_id ON item (created_at, id)`);
        await queryRunner.query(`CREATE INDEX review_idx_created_id ON review (created_at, id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX account_idx_created_id`);
        await queryRunner.query(`DROP INDEX item_idx_created_id`);
        await queryRunner.query(`DROP INDEX review_idx_created_id`);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAverageRatingColumn1766105928993 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the constraint first
        await queryRunner.query(`
            ALTER TABLE "item"
            DROP CONSTRAINT IF EXISTS "average_rating_range";
        `);

        // Drop the average_rating column
        await queryRunner.query(`
            ALTER TABLE "item"
            DROP COLUMN "average_rating";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add the column back
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD COLUMN "average_rating" numeric(3,1) DEFAULT '0.0';
        `);

        // Add the constraint back
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "average_rating_range"
            CHECK (average_rating >= 0 AND average_rating <= 10);
        `);
    }
}

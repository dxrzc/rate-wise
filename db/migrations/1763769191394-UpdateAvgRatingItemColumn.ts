import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAvgRatingItemColumn1763769191394 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // change type
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "average_rating"
            SET DATA TYPE numeric(3,1);
        `);

        // set default
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "average_rating"
            SET DEFAULT '0.0';
        `);

        // add  0-10 constraint
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "average_rating_range"
            CHECK (average_rating >= 0 AND average_rating <= 10);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "item"
            DROP CONSTRAINT "average_rating_range";
        `);

        // Restore default to old value
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "average_rating"
            SET DEFAULT '0';
        `);

        // Restore previous type numeric(3,2)
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "average_rating"
            SET DATA TYPE numeric(3,2);
        `);
    }
}

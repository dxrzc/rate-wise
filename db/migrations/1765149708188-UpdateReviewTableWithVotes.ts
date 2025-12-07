import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReviewTableWithVotes1765149708188 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // delete old "votes" column
        queryRunner.query(`
            ALTER TABLE "review" DROP COLUMN "votes";
        `);

        // add "upvotes" and "downvote column"
        queryRunner.query(`
            ALTER TABLE "review"
            ADD COLUMN "upvotes" INTEGER NOT NULL DEFAULT 0;
        `);
        queryRunner.query(`
            ALTER TABLE "review"
            ADD COLUMN "downvotes" INTEGER NOT NULL DEFAULT 0;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // remove "upvotes" and "downvotes" columns
        queryRunner.query(`
            ALTER TABLE "review" DROP COLUMN "upvotes";
        `);    
        queryRunner.query(`
            ALTER TABLE "review" DROP COLUMN "downvotes";
        `);

        // add old "votes" column
        queryRunner.query(`
            ALTER TABLE "review"
            ADD COLUMN "votes" INTEGER NOT NULL DEFAULT 0;
        `);
    }
}

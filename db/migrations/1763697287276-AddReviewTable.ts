import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewTable1763697287276 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // create table
        await queryRunner.query(`
            CREATE TABLE "review" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "content" text NOT NULL,
                "votes" integer NOT NULL DEFAULT 0,
                "rating" integer NOT NULL,
                "account_id" uuid NOT NULL,            
                "item_id" uuid NOT NULL
            );
        `);

        // rating 0-5 constraint
        await queryRunner.query(`
            ALTER TABLE "review"
            ADD CONSTRAINT review_rating_check
            CHECK (rating >= 0 AND rating <= 10);
        `);

        // account fk
        await queryRunner.query(`
            ALTER TABLE "review"
            ADD CONSTRAINT fk_review_account
            FOREIGN KEY ("account_id")
            REFERENCES "account"("id")
            ON DELETE CASCADE
        `);

        // item fk
        await queryRunner.query(`
            ALTER TABLE "review"
            ADD CONSTRAINT fk_review_item
            FOREIGN KEY ("item_id")
            REFERENCES "item"("id")
            ON DELETE CASCADE
        `);

        // delete "review_count" column in item
        await queryRunner.query(`
            ALTER TABLE "item"
            DROP COLUMN "review_count";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "review"
            DROP CONSTRAINT fk_review_item;
        `);

        await queryRunner.query(`
            ALTER TABLE "review"
            DROP CONSTRAINT fk_review_account;
        `);

        await queryRunner.query(`
            ALTER TABLE "review"
            DROP CONSTRAINT review_rating_check;
        `);

        await queryRunner.query(`
            DROP TABLE "review";
        `);

        await queryRunner.query(`
            ALTER TABLE "item"
            ADD COLUMN "review_count" integer NOT NULL DEFAULT 0;
        `);
    }
}

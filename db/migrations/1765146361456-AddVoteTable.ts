import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVotesTable1765146361456 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // votes-type enum
        await queryRunner.query(`
            CREATE TYPE vote_type AS ENUM ('up', 'down');
        `);

        // votes table
        await queryRunner.query(`
            CREATE TABLE "vote" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "vote" vote_type NOT NULL,
                "account_id" uuid NOT NULL,            
                "review_id" uuid NOT NULL
            );
        `);

        // account fk
        await queryRunner.query(`
            ALTER TABLE "vote"
            ADD CONSTRAINT fk_vote_account
            FOREIGN KEY ("account_id")
            REFERENCES "account"("id")
            ON DELETE CASCADE
        `);

        // review fk
        await queryRunner.query(`
            ALTER TABLE "vote"
            ADD CONSTRAINT fk_vote_review
            FOREIGN KEY ("review_id")
            REFERENCES "review"("id")
            ON DELETE CASCADE
        `);

        // one-vote-per-user-per-review constraint
        await queryRunner.query(`
            ALTER TABLE "vote"
            ADD CONSTRAINT unique_vote_per_user_review
            UNIQUE ("account_id", "review_id");
        `);

        // index for pagination
        await queryRunner.query(`
            CREATE INDEX vote_idx_created_id 
            ON "vote" (created_at, id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // idx
        await queryRunner.query(`
            DROP INDEX IF EXISTS vote_idx_created_id;
        `);

        // unique constraint
        await queryRunner.query(`
            ALTER TABLE "vote"
            DROP CONSTRAINT IF EXISTS unique_vote_per_user_review;
        `);

        // fks
        await queryRunner.query(`
            ALTER TABLE "vote"
            DROP CONSTRAINT IF EXISTS fk_vote_account;
        `);
        await queryRunner.query(`
            ALTER TABLE "vote"
            DROP CONSTRAINT IF EXISTS fk_vote_review;
        `);

        // table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "vote";
        `);

        // vote-type enum
        await queryRunner.query(`
            DROP TYPE IF EXISTS vote_type;
        `);
    }
}

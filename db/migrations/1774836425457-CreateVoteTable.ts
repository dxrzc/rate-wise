import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoteTable1774836425457 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE vote_action AS ENUM ('up', 'down');`);

        await queryRunner.query(`
            CREATE TABLE vote (
            	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            	action vote_action NOT NULL, 
            	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,	
            	created_by UUID NOT NULL,
            	related_review UUID NOT NULL,
            	CONSTRAINT vote_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE CASCADE,
            	CONSTRAINT vote_related_review_fk FOREIGN KEY (related_review) REFERENCES review(id) ON DELETE CASCADE,
            	CONSTRAINT vote_owner_review_unique UNIQUE (created_by, related_review)
            );
        `);

        // For fetching votes for a review + delete cascade
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vote_review_date
            ON vote (related_review, created_at, id);
        `);

        // For fetching a user's votes + delete cascade
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vote_owner_date
            ON vote (created_by, created_at, id);
        `);

        // Update the updated_at timestamp on every update
        await queryRunner.query(`
            CREATE TRIGGER set_timestamp_on_vote
            BEFORE UPDATE ON vote
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await  queryRunner.query(`DROP TABLE IF EXISTS vote;`);
        await queryRunner.query(`DROP TYPE IF EXISTS vote_action;`);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewTable1774833858910 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE review (
            	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            	content TEXT NOT NULL,
            	rating INTEGER NOT NULL,
            	upvotes INTEGER NOT NULL DEFAULT 0,
            	downvotes INTEGER NOT NULL DEFAULT 0,
            	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            	created_by UUID NOT NULL,
            	related_item UUID NOT NULL,
            	CONSTRAINT review_content_len_chk CHECK (LENGTH(content) BETWEEN 10 AND 2000),
            	CONSTRAINT review_valid_rating_chk CHECK (rating BETWEEN 0 AND 10),
            	CONSTRAINT review_valid_upvotes_chk CHECK (upvotes >= 0),
            	CONSTRAINT review_valid_downvotes_chk CHECK (downvotes >= 0),
            	CONSTRAINT review_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE CASCADE,
            	CONSTRAINT review_related_item_fk FOREIGN KEY (related_item) REFERENCES item(id) ON DELETE CASCADE,
            	CONSTRAINT review_owner_item_unique UNIQUE (created_by, related_item)	
            );
        `);

        // For global pagination
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_review_created_at_id 
            ON review (created_at, id);
        `);

        // For fetching reviews for a specific item + delete cascade
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_review_related_item_date 
            ON review (related_item, created_at, id);
        `);

        // For fetching reviews by user + delete cascade
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_review_owner_date 
            ON review (created_by, created_at, id);
        `);

        // Update the updated_at timestamp on every update
        await queryRunner.query(`
            CREATE TRIGGER set_timestamp_on_review
            BEFORE UPDATE ON review
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS review;`);
    }
}

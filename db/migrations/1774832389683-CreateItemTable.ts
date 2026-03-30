import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemTable1774832389683 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE DOMAIN item_tag_type AS TEXT
            CHECK (LENGTH(VALUE) BETWEEN 2 AND 20);
        `);

        await queryRunner.query(`
           CREATE TABLE item (
            	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            	title TEXT NOT NULL,
            	description TEXT NOT NULL,
            	category TEXT NOT NULL,
            	tags item_tag_type[] NOT NULL DEFAULT '{}',
            	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            	created_by UUID NOT NULL,
            	CONSTRAINT item_title_len_chk CHECK (LENGTH(title) BETWEEN 5 AND 40),
            	CONSTRAINT item_description_len_chk CHECK (LENGTH(description) BETWEEN 5 AND 500),
            	CONSTRAINT item_category_len_chk CHECK (LENGTH(category) BETWEEN 3 AND 40),
            	CONSTRAINT item_tags_max_count_chk CHECK (CARDINALITY(tags) <= 10),	
            	CONSTRAINT item_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id) ON DELETE CASCADE,
            	CONSTRAINT item_owner_title_unique UNIQUE (created_by, title)	
            ); 
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_created_at_id 
            ON item (created_at, id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_item_tags_gin 
            ON item USING GIN (tags);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_item_category 
            ON item (category);
        `);

        await queryRunner.query(`
            CREATE TRIGGER set_timestamp_on_item
            BEFORE UPDATE ON item
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS item`);
        await queryRunner.query(`DROP DOMAIN IF EXISTS item_tag_type`);
    }
}

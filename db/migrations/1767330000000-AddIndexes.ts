import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1767330000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // for paginating all accounts
        await queryRunner.query(`CREATE INDEX account_idx_created_id ON account (created_at, id)`);

        // for paginating all items (without filters)
        await queryRunner.query(`CREATE INDEX item_idx_created_id ON item (created_at, id)`);

        // for paginating items by account + FK(account_id) ON DELETE CASCADE support
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS item_idx_account_created_id ON item (account_id, created_at, id)`,
        );

        // for paginating items by category
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS item_idx_category_created_id ON item (category, created_at, id)`,
        );

        // for filtering items by tags
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS item_tags_gin_idx ON item USING GIN (tags)`,
        );

        // for paginating reviews by account + FK(account_id) ON DELETE CASCADE support
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS review_idx_account_created_id ON review (account_id, created_at, id)`,
        );

        // for paginating reviews for an item + FK(item_id) ON DELETE CASCADE support
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS review_idx_item_created_id ON review (item_id, created_at, id)`,
        );

        // for paginating votes for a review + FK(review_id) ON DELETE CASCADE support
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS vote_idx_review_created_id ON vote (review_id, created_at, id)`,
        );

        // for account->votes FK DELETE CASCADE
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS vote_idx_account_id ON vote (account_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS vote_idx_account_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS vote_idx_review_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS review_idx_item_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS review_idx_account_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS item_tags_gin_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS item_idx_category_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS item_idx_account_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS item_idx_created_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS account_idx_created_id`);
    }
}

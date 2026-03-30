import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountTable1774581701169 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Reusable function to set the updated_at timestamp on updates
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION trigger_set_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TYPE account_roles 
            AS ENUM ('reviewer', 'creator', 'moderator', 'admin');
        `);

        await queryRunner.query(`
            CREATE TYPE account_statuses
            AS ENUM ('active', 'pending_verification', 'suspended');
        `);

        await queryRunner.query(`
            CREATE TABLE account (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                roles account_roles[] NOT NULL DEFAULT ARRAY['reviewer', 'creator']::account_roles[],
                status account_statuses NOT NULL DEFAULT 'pending_verification',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,   
                CONSTRAINT account_username_lowercase_chk CHECK(username = LOWER(username)),                
                CONSTRAINT account_username_len_chk CHECK (LENGTH(username) BETWEEN 3 AND 30),
                CONSTRAINT account_valid_username_chk CHECK (username ~ '^[a-z0-9_]+$'),
                CONSTRAINT account_email_lowercase_chk CHECK(email = LOWER(email)),
                CONSTRAINT account_email_len_chk CHECK (LENGTH(email) <= 254),
                CONSTRAINT account_email_format_chk CHECK (email LIKE '%@%'),
                CONSTRAINT account_password_len_chk CHECK (LENGTH(password_hash) BETWEEN 8 AND 60)
            )
        `);

        // For global pagination
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_account_created_at_id 
            ON account (created_at, id);
        `);
        
        // Update the updated_at timestamp on every update
        await queryRunner.query(`
            CREATE TRIGGER set_timestamp_on_account
            BEFORE UPDATE ON account
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS set_timestamp_on_account ON account;`);
        await queryRunner.query(`DROP TABLE IF EXISTS account;`);
        await queryRunner.query(`DROP TYPE IF EXISTS account_roles;`);
        await queryRunner.query(`DROP TYPE IF EXISTS account_statuses`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS trigger_set_timestamp;`);
    }
}

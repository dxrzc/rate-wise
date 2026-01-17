import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePasswordToPasswordHash1768324899850 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            RENAME COLUMN "password" TO "password_hash"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`
            ALTER TABLE "account"
            RENAME COLUMN "password_hash" TO "password"
    `);
    }
}

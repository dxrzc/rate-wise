import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePasswordColumnToText1765658611991 implements MigrationInterface {
    name = 'ChangePasswordColumnToText1765658611991';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "password" TYPE TEXT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "password" TYPE character varying(60)
        `);
    }
}

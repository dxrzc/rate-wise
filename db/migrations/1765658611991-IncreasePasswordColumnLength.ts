import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreasePasswordColumnLength1765658611991 implements MigrationInterface {
    name = 'IncreasePasswordColumnLength1765658611991';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "password" TYPE character varying(128)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "password" TYPE character varying(60)
        `);
    }
}

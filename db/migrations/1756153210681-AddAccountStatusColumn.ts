import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountStatusColumn1756153210681 implements MigrationInterface {
    name = 'AddAccountStatusColumn1756153210681';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."account_status_enum" AS ENUM('active', 'pending_verification', 'suspended')
        `);

        await queryRunner.query(`
            ALTER TABLE "account"
            ADD "status" "public"."account_status_enum"
            NOT NULL DEFAULT 'pending_verification'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."account_status_enum"`);
    }
}

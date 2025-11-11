import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemConstraints1762821003186 implements MigrationInterface {
    name = 'AddItemConstraints1762821003186';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // "account_id" to NOT NULL
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "account_id" SET NOT NULL
        `);

        // title is unique
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "UQ_item_title" UNIQUE ("title")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {        
        await queryRunner.query(`
            ALTER TABLE "item"
            DROP CONSTRAINT "UQ_item_title"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "item"
            ALTER COLUMN "account_id" DROP NOT NULL
        `);
    }
}

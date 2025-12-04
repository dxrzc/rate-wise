import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRolesEnum1764716490374 implements MigrationInterface {
    name = 'UpdateUserRolesEnum1764716490374';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // "reviewer" role
        await queryRunner.query(`
            ALTER TYPE "public"."account_role_enum" RENAME VALUE 'user' TO 'reviewer';
        `);

        // "creator" role
        await queryRunner.query(`
            ALTER TYPE "public"."account_role_enum" ADD VALUE 'creator';
        `);

        // "reviewer" as default role, just in case
        await queryRunner.query(`
            ALTER TABLE "account" 
            ALTER COLUMN "roles" 
            SET DEFAULT ARRAY['reviewer']::"public"."account_role_enum"[];
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // revert default
        await queryRunner.query(`
            ALTER TABLE "account" 
            ALTER COLUMN "roles" 
            SET DEFAULT ARRAY['user']::"public"."account_role_enum"[];
        `);

        // rename "reviewer" back to "user"
        await queryRunner.query(`
            ALTER TYPE "public"."account_role_enum" RENAME VALUE 'reviewer' TO 'user';
        `);

        // "creator" is not removed since I would need to recreate the enum type from scratch
        // it doesnt matter since the enum value is not used anymore
    }
}

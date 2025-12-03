import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultipleRolesPerUser1762383175684 implements MigrationInterface {
    name = 'MultipleRolesPerUser1762383175684';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename "role" column to "roles"
        await queryRunner.query(`
            ALTER TABLE "account" 
            RENAME COLUMN "role" TO "roles";
        `);
        // Drop default
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "roles" DROP DEFAULT;
        `);
        // Change the column type to an array of roles
        // each existing value becomes a single-element array
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "roles"
            SET DATA TYPE "public"."account_role_enum"[]
            USING ARRAY[roles]::"public"."account_role_enum"[];
        `);
        // Set the default value to "[user]""
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "roles"
            SET DEFAULT ARRAY['user']::"public"."account_role_enum"[];
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove default value
        await queryRunner.query(`
            ALTER TABLE "account" 
            ALTER COLUMN "roles" 
            DROP DEFAULT;
        `);
        // Change the column type back to a single role
        // taking the first element of the array
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "roles"
            SET DATA TYPE "public"."account_role_enum"
            USING "roles"[1];
        `);
        // Rename back to "role"
        await queryRunner.query(`
            ALTER TABLE "account" 
            RENAME COLUMN "roles" TO "role";
        `);
        // Restore default value to "user"
        await queryRunner.query(`
            ALTER TABLE "account"
            ALTER COLUMN "role"
            SET DEFAULT 'user';
        `);
    }
}

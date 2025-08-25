import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountAndItemTables1756151505289
    implements MigrationInterface
{
    name = 'AddAccountAndItemTables1756151505289';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(40) NOT NULL, "description" text NOT NULL, "category" character varying(40) NOT NULL, "tags" character varying(20) array NOT NULL, "average_rating" numeric(3,2) NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "account_id" uuid, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."account_role_enum" AS ENUM('user', 'moderator', 'admin')`,
        );
        await queryRunner.query(
            `CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying(30) NOT NULL, "email" character varying(45) NOT NULL, "password" character varying(60) NOT NULL, "role" "public"."account_role_enum" NOT NULL DEFAULT 'user', "reputation_score" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_41dfcb70af895ddf9a53094515b" UNIQUE ("username"), CONSTRAINT "UQ_4c8f96ccf523e9a3faefd5bdd4c" UNIQUE ("email"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "item" ADD CONSTRAINT "FK_f8e90c90aea7e57bd474170f35b" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "item" DROP CONSTRAINT "FK_f8e90c90aea7e57bd474170f35b"`,
        );
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TYPE "public"."account_role_enum"`);
        await queryRunner.query(`DROP TABLE "item"`);
    }
}

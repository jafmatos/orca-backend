import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLimits1763757030249 implements MigrationInterface {
  name = "AddLimits1763757030249";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."entry_recurrency_type_enum" AS ENUM('monthly', 'weekly', 'daily')`);
    await queryRunner.query(`CREATE TYPE "public"."entry_recurrency_action_enum" AS ENUM('create', 'notify')`);
    await queryRunner.query(
      `CREATE TABLE "entry_recurrency" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."entry_recurrency_type_enum" NOT NULL, "action" "public"."entry_recurrency_action_enum" NOT NULL, CONSTRAINT "PK_0f8c33375f962da793f5320e3d9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "category" RENAME COLUMN "mark" TO "type"`);
    await queryRunner.query(
      `CREATE TABLE "limit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" double precision NOT NULL, "userId" character varying NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "REL_58f7dea672fb4b785e2b930177" UNIQUE ("categoryId"), CONSTRAINT "PK_6e82b66197d877e780e19c0aadc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "entry" ADD "recurrencyId" uuid`);
    await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`);
    await queryRunner.query(`CREATE TYPE "public"."category_type_enum" AS ENUM('expense', 'income')`);
    await queryRunner.query(`ALTER TABLE "category" ADD "type" "public"."category_type_enum" NOT NULL DEFAULT 'expense'`);
    await queryRunner.query(
      `ALTER TABLE "entry" ADD CONSTRAINT "FK_57dccf72dfa56f4266177cb75cb" FOREIGN KEY ("recurrencyId") REFERENCES "entry_recurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "limit" ADD CONSTRAINT "FK_58f7dea672fb4b785e2b9301773" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "limit" DROP CONSTRAINT "FK_58f7dea672fb4b785e2b9301773"`);
    await queryRunner.query(`ALTER TABLE "entry" DROP CONSTRAINT "FK_57dccf72dfa56f4266177cb75cb"`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."category_type_enum"`);
    await queryRunner.query(`ALTER TABLE "category" ADD "type" double precision`);
    await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    await queryRunner.query(`ALTER TABLE "entry" DROP COLUMN "recurrencyId"`);
    await queryRunner.query(`DROP TABLE "limit"`);
    await queryRunner.query(`DROP TABLE "entry_recurrency"`);
    await queryRunner.query(`DROP TYPE "public"."entry_recurrency_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."entry_recurrency_type_enum"`);
    await queryRunner.query(`ALTER TABLE "category" RENAME COLUMN "type" TO "mark"`);
  }
}

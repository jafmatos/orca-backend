import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRemindersAddRecurrency1763261183412 implements MigrationInterface {
    name = 'RemoveRemindersAddRecurrency1763261183412'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entry_recurrency_type_enum" AS ENUM('monthly', 'weekly', 'daily')`);
        await queryRunner.query(`CREATE TYPE "public"."entry_recurrency_action_enum" AS ENUM('create', 'notify')`);
        await queryRunner.query(`CREATE TABLE "entry_recurrency" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."entry_recurrency_type_enum" NOT NULL, "action" "public"."entry_recurrency_action_enum" NOT NULL, CONSTRAINT "PK_0f8c33375f962da793f5320e3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "entry" ADD "recurrencyId" uuid`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ADD CONSTRAINT "FK_57dccf72dfa56f4266177cb75cb" FOREIGN KEY ("recurrencyId") REFERENCES "entry_recurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry" DROP CONSTRAINT "FK_57dccf72dfa56f4266177cb75cb"`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" DROP COLUMN "recurrencyId"`);
        await queryRunner.query(`DROP TABLE "entry_recurrency"`);
        await queryRunner.query(`DROP TYPE "public"."entry_recurrency_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."entry_recurrency_type_enum"`);
    }

}

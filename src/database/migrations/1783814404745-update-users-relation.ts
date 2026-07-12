import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsersRelation1783814404745 implements MigrationInterface {
    name = 'UpdateUsersRelation1783814404745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 7. Alterações em users
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "periodGe"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "periodLe"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "periodManuallyAdjusted"`);
        await queryRunner.query(`ALTER TABLE "users" ADD IF NOT EXISTS "salaryDay" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`UPDATE "users" SET "salaryDay" = "periodReferenceDay" WHERE "periodReferenceDay" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "periodReferenceDay"`);

        // 8. Conversão de tipos de amount
        await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);

        // 9. plan: text → jsonb (preserva dados existentes via cast)
        await queryRunner.query(`ALTER TABLE "plan" ALTER COLUMN "benefits" TYPE jsonb USING "benefits"::jsonb`);
        await queryRunner.query(`ALTER TABLE "plan" ALTER COLUMN "duration" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "plan" ALTER COLUMN "duration" TYPE jsonb USING "duration"::jsonb`);
        await queryRunner.query(`ALTER TABLE "plan" ALTER COLUMN "duration" SET DEFAULT '{"interval":"monthly","intervalCount":1}'`);

        // 10. analysis: text → jsonb (preserva dados existentes via cast)
        await queryRunner.query(`ALTER TABLE "analysis" ALTER COLUMN "output" TYPE jsonb USING "output"::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

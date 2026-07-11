import { MigrationInterface, QueryRunner } from "typeorm";

export class MigratingFramework1783807385435 implements MigrationInterface {
    name = 'MigratingFramework1783807385435'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 0. Garante coluna createdAt legada em schedule_occurrence
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);

        // 1. Remove FKs temporariamente
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" DROP CONSTRAINT "FK_0f0a5c71eee1640b7978baa9d7b"`);
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" DROP CONSTRAINT "FK_a28785e29035de344f4714a44ac"`);

        // 2. Adiciona novas colunas SEM NOT NULL para permitir UPDATE antes
        await queryRunner.query(`ALTER TABLE "schedule" ADD IF NOT EXISTS "dayOfMonth" integer`);
        await queryRunner.query(`ALTER TABLE "schedule" ADD IF NOT EXISTS "time" character varying(5)`);
        await queryRunner.query(`ALTER TABLE "schedule" ADD IF NOT EXISTS "timezone" character varying(50)`);

        // 3. Migra dados de referenceTimestamp para as novas colunas
        await queryRunner.query(`
            UPDATE "schedule"
            SET
                "time"       = to_char("referenceTimestamp", 'HH24:MI'),
                "timezone"   = 'America/Sao_Paulo',
                "dayOfMonth" = EXTRACT(DAY FROM "referenceTimestamp")::integer
            WHERE "referenceTimestamp" IS NOT NULL
        `);

        // 4. Migra ocorrências de childEntryId → schedule_occurrence (modelo legado)
        //    Protegido com verificação de existência da coluna pois pode já ter sido removida
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'schedule' AND column_name = 'childEntryId'
                ) THEN
                    INSERT INTO "schedule_occurrence" ("scheduleId", "entryId", "createdAt")
                    SELECT s."id", s."childEntryId", now()
                    FROM "schedule" s
                    WHERE s."childEntryId" IS NOT NULL
                      AND s."childEntryId" NOT IN (SELECT "entryId" FROM "schedule_occurrence");
                END IF;
            END $$
        `);

        // 5. Aplica NOT NULL após dados migrados
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "time" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "timezone" SET NOT NULL`);

        // 6. Remove colunas e constraints legadas
        await queryRunner.query(`ALTER TABLE "schedule" DROP CONSTRAINT IF EXISTS "FK_1e643f41fd246f175201bdc144c"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP CONSTRAINT IF EXISTS "REL_1e643f41fd246f175201bdc144"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN IF EXISTS "childEntryId"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN IF EXISTS "referenceTimestamp"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN IF EXISTS "when"`);

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

        // 11. Restaura FKs
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "FK_0f0a5c71eee1640b7978baa9d7b" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "FK_a28785e29035de344f4714a44ac" FOREIGN KEY ("entryId") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" DROP CONSTRAINT "FK_a28785e29035de344f4714a44ac"`);
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" DROP CONSTRAINT "FK_0f0a5c71eee1640b7978baa9d7b"`);
        await queryRunner.query(`ALTER TABLE "analysis" DROP COLUMN "output"`);
        await queryRunner.query(`ALTER TABLE "analysis" ADD "output" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "plan" ADD "duration" text NOT NULL DEFAULT '{"interval":"monthly","intervalCount":1}'`);
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "benefits"`);
        await queryRunner.query(`ALTER TABLE "plan" ADD "benefits" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "salaryDay"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN "time"`);
        await queryRunner.query(`ALTER TABLE "schedule" DROP COLUMN "dayOfMonth"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "periodReferenceDay" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "periodManuallyAdjusted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "periodLe" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "periodGe" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "schedule" ADD "referenceTimestamp" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "FK_a28785e29035de344f4714a44ac" FOREIGN KEY ("entryId") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedule_occurrence" ADD CONSTRAINT "FK_0f0a5c71eee1640b7978baa9d7b" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}


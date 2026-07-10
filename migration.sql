-- Adiciona createdAt em schedule_occurrence caso nao exista (legado não tinha)
ALTER TABLE "schedule_occurrence" ADD COLUMN IF NOT EXISTS "createdAt" timestamp without time zone NOT NULL DEFAULT now();

-- Adiciona colunas novas
ALTER TABLE "schedule" ADD COLUMN IF NOT EXISTS "dayOfMonth" integer;
ALTER TABLE "schedule" ADD COLUMN IF NOT EXISTS "time" varchar(5);
ALTER TABLE "schedule" ADD COLUMN IF NOT EXISTS "timezone" varchar(50);

-- Extrai os dados do referenceTimestamp para as novas colunas
UPDATE "schedule"
SET 
  "time" = to_char("referenceTimestamp", 'HH24:MI'),
  "timezone" = 'America/Sao_Paulo',
  "dayOfMonth" = EXTRACT(DAY FROM "referenceTimestamp")
WHERE "referenceTimestamp" IS NOT NULL;

-- Garante NOT NULL para time e timezone
ALTER TABLE "schedule" ALTER COLUMN "time" SET NOT NULL;
ALTER TABLE "schedule" ALTER COLUMN "timezone" SET NOT NULL;

-- Migra ocorrências de childEntryId para a tabela schedule_occurrence
INSERT INTO "schedule_occurrence" ("scheduleId", "entryId", "createdAt")
SELECT "id", "childEntryId", "createdAt"
FROM "schedule"
WHERE "childEntryId" IS NOT NULL 
AND "childEntryId" NOT IN (SELECT "entryId" FROM "schedule_occurrence");

-- Limpa os rastros do modelo legado
ALTER TABLE "schedule" DROP CONSTRAINT IF EXISTS "FK_1e643f41fd246f175201bdc144c";
ALTER TABLE "schedule" DROP CONSTRAINT IF EXISTS "REL_1e643f41fd246f175201bdc144";
ALTER TABLE "schedule" DROP COLUMN IF EXISTS "childEntryId";
ALTER TABLE "schedule" DROP COLUMN IF EXISTS "referenceTimestamp";
ALTER TABLE "schedule" DROP COLUMN IF EXISTS "when";

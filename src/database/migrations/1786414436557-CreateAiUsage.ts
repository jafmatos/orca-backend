import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiUsage1786414436557 implements MigrationInterface {
  name = 'CreateAiUsage1786414436557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ai_usage_type_enum" AS ENUM('analysis', 'assistant', 'smart-extract')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."ai_usage_type_enum" NOT NULL, "inputTokens" integer NOT NULL, "outputTokens" integer NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3dddab3a15520a9c3eba859195d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_78dc7868aa4f86176b5b7c4395c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_78dc7868aa4f86176b5b7c4395c"`,
    );
    await queryRunner.query(`DROP TABLE "ai_usage"`);
    await queryRunner.query(`DROP TYPE "public"."ai_usage_type_enum"`);
  }
}

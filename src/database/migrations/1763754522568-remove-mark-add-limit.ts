import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMarkAddLimit1763754522568 implements MigrationInterface {
  name = "RemoveMarkAddLimit1763754522568";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
    await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
  }
}

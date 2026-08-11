import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiUsageEntity1786417979631 implements MigrationInterface {
    name = 'AddAiUsageEntity1786417979631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "schedule" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "limit" ALTER COLUMN "amount" TYPE double precision`);
    }

}

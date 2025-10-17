import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntryAutomatically1760728486621 implements MigrationInterface {
    name = 'CreateEntryAutomatically1760728486621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" ADD "createEntryAutomatically" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "reminder" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "push_subscription" ADD CONSTRAINT "UQ_27ae9074fc39a09bc1aee263df5" UNIQUE ("endpoint")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "push_subscription" DROP CONSTRAINT "UQ_27ae9074fc39a09bc1aee263df5"`);
        await queryRunner.query(`ALTER TABLE "reminder" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "createEntryAutomatically"`);
    }

}

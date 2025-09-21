import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPlan1758397884395 implements MigrationInterface {
    name = 'AlterPlan1758397884395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    }

}

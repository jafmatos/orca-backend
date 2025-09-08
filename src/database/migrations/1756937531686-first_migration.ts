import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1756937531686 implements MigrationInterface {
    name = 'FirstMigration1756937531686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "mark" TYPE double precision`);
        await queryRunner.query(`ALTER TABLE "entry" ALTER COLUMN "amount" TYPE double precision`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class UseDatetimeReminders1760733088882 implements MigrationInterface {
    name = 'UseDatetimeReminders1760733088882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "dayOfMonth"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "time"`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "referenceDateTime" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "referenceDateTime"`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "time" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "dayOfMonth" integer NOT NULL`);
    }

}

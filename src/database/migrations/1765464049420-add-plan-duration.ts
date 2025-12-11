import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanDuration1765464049420 implements MigrationInterface {
    name = 'AddPlanDuration1765464049420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan" ADD "duration" text NOT NULL DEFAULT '{"interval":"monthly","intervalCount":1}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "duration"`);
    }

}

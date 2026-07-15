import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPrivateAndLifetimePlans1784078842894 implements MigrationInterface {
    name = 'AddIsPrivateAndLifetimePlans1784078842894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan" ADD "isPrivate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "stripeId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodStart" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodStart" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodEnd" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodEnd" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodEnd" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodEnd" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodStart" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "currentPeriodStart" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "stripeId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "isPrivate"`);
    }

}

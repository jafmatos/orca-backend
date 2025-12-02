import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToRecurrency1764634970952 implements MigrationInterface {
  name = "AddUserIdToRecurrency1764634970952";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entry_recurrency" ADD COLUMN "userId" uuid DEFAULT NULL;`);
    await queryRunner.query(
      `ALTER TABLE "entry_recurrency" ADD CONSTRAINT "FK_fb0cb84777e94519838c32894f9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;`
    );
    await queryRunner.query(
      `UPDATE entry_recurrency SET "userId" = entry."userId" FROM entry WHERE entry."recurrencyId" = entry_recurrency.id;`
    );
    await queryRunner.query(`DELETE FROM entry_recurrency WHERE "userId" IS NULL;`);
    await queryRunner.query(`ALTER TABLE "entry_recurrency" ALTER COLUMN "userId" SET NOT NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

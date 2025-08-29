import { QueryRunner } from "typeorm";
import { dataSource } from "./data-source";

export class TypeormTransaction {
  private queryRunner!: QueryRunner;

  public async begin() {
    this.queryRunner = dataSource.createQueryRunner();

    await this.queryRunner.connect();

    return this.queryRunner.startTransaction();
  }

  public async commit() {
    if (!this.queryRunner) throw new Error("You have to create a query runner before managing the transaction");

    return this.queryRunner.commitTransaction();
  }

  public async rollback() {
    if (!this.queryRunner) throw new Error("You have to create a query runner before managing the transaction");

    return this.queryRunner.rollbackTransaction();
  }

  public async release() {
    if (!this.queryRunner) throw new Error("You have to create a query runner before managing the transaction");

    return this.queryRunner.release();
  }

  get manager() {
    return this.queryRunner.manager;
  }
}

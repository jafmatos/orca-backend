import { EntityTarget, ObjectLiteral } from "typeorm";
import { dataSource } from "../data-source";

export class SeederData<E> {
  private _rows: E[] = [];

  getRandomOne() {
    const randomIndex = Math.floor(Math.random() * this._rows.length);

    return this._rows[randomIndex];
  }

  getRandomMany(count: number) {
    if (count > this._rows.length) return this._rows;

    const sectorLength = Math.floor(this._rows.length / count);

    return Array(count)
      .fill(null)
      .map((_, index) => {
        const startIndex = index * sectorLength;
        const endIndex = index === count - 1 ? this._rows.length : (index + 1) * sectorLength;
        const randomIndex = startIndex + Math.floor(Math.random() * (endIndex - startIndex));

        return this._rows[randomIndex];
      });
  }

  get rows() {
    return this._rows;
  }

  set rows(rows: E[]) {
    this._rows = rows;
  }
}

export abstract class BaseSeeder<Input, Output = Input> {
  public entityClass: EntityTarget<Input>;
  public data: SeederData<Output> = new SeederData<Output>();

  constructor(entityClass: EntityTarget<Input>) {
    this.entityClass = entityClass;
  }

  public abstract generate(): Input;

  public async save(rows: Input[]): Promise<Output[]> {
    const savedRows = await dataSource.getRepository(this.entityClass as any).save(rows as any);

    this.data.rows = savedRows;

    return savedRows;
  }

  public seed(count: number) {
    const rows = Array(count)
      .fill(false)
      .map(() => this.generate());

    return this.save(rows);
  }
}

import { Jetpack } from "Src/helpers/Jetpack";
import { AfterInsert, AfterLoad, AfterRecover, AfterRemove, AfterSoftRemove, AfterUpdate, Column, PrimaryGeneratedColumn } from "typeorm";

export class File {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  fileName!: string;

  url!: string;

  @AfterInsert()
  @AfterLoad()
  @AfterRecover()
  @AfterRemove()
  @AfterSoftRemove()
  @AfterUpdate()
  setUrl() {
    this.url = Jetpack.fileUrl(this.fileName);
  }
}

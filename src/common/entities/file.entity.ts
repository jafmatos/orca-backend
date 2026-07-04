import { Jetpack } from '@/common/helpers/jetpack.helper';
import {
  AfterInsert,
  AfterLoad,
  AfterRecover,
  AfterRemove,
  AfterUpdate,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fileName!: string;

  url!: string;

  @AfterInsert()
  @AfterLoad()
  @AfterRecover()
  @AfterRemove()
  @AfterUpdate()
  setUrl() {
    this.url = Jetpack.fileUrl(this.fileName);
  }
}

import { BeforeRemove, Entity, JoinColumn, OneToOne } from "typeorm";
import { File } from "./File.entity";
import { User } from "./User.entity";
import { Jetpack } from "Src/helpers/Jetpack";

@Entity()
export class Avatar extends File {
  @OneToOne(() => User, (user) => user.avatar, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  user?: User;

  @BeforeRemove()
  async removeFile() {
    try {
      await Jetpack.removeFile(this.fileName);
    } catch (error) {
      console.log(`Failed to remove file: ${this.fileName}`);
    }
  }
}

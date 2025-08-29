import { Entity, JoinColumn, OneToOne } from "typeorm";
import { File } from "./File.entity";
import { User } from "./User.entity";

@Entity()
export class Avatar extends File {
  @OneToOne(() => User, (user) => user.avatar, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  user?: User;
}

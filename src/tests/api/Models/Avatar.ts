import { File } from "./File";
import { User } from "./User";

export class Avatar extends File {
  constructor(public id: string, public fileName: string, public url: string, public user: User) {
    super(id, fileName, url);
  }
}

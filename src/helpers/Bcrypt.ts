import bcrypt from "bcrypt";

export class Bcrypt {
  public static hash(data: string | Buffer) {
    const hash = bcrypt.hashSync(data, 10);

    return hash;
  }

  public static compare(data: string | Buffer, encrypted: string) {
    const matches = bcrypt.compareSync(data, encrypted);

    return matches;
  }
}

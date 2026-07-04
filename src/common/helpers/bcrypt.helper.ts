import * as bcrypt from 'bcrypt';

export class Bcrypt {
  public static hash(data: string | Buffer): string {
    return bcrypt.hashSync(data, 10);
  }

  public static compare(data: string | Buffer, encrypted: string): boolean {
    return bcrypt.compareSync(data, encrypted);
  }
}

import * as jetpack from 'fs-jetpack';
import * as path from 'path';

export class Jetpack {
  public static get path() {
    return path.resolve(process.env.APP_DIR || process.cwd(), 'uploads');
  }

  public static get url() {
    return `${process.env.APP_URL || 'http://localhost:3000'}/uploads`;
  }

  public static async upload({
    data,
    fileName,
  }: {
    data: Buffer;
    fileName: string;
  }) {
    await jetpack.writeAsync(this.filePath(fileName), data);
  }

  public static async removeFile(fileName: string) {
    await jetpack.removeAsync(this.filePath(fileName));
  }

  public static filePath(fileName: string) {
    return path.join(this.path, fileName);
  }

  public static fileUrl(fileName: string) {
    return `${this.url}/${fileName}`;
  }
}

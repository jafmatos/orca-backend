import jetpack from "fs-jetpack";

export class Jetpack {
  public static path = `${process.env.APP_DIR}/uploads`;
  public static url = `${process.env.APP_URL}/uploads`;

  public static async upload({ data, fileName }: { data: Buffer; fileName: string }) {
    await jetpack.writeAsync(this.filePath(fileName), data);
  }

  public static async removeFile(fileName: string) {
    await jetpack.removeAsync(this.filePath(fileName));
  }

  public static filePath(fileName: string) {
    return `${this.path}/${fileName}`;
  }

  public static fileUrl(fileName: string) {
    return `${this.url}/${fileName}`;
  }
}

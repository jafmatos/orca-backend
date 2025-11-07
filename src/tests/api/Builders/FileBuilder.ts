import { File } from "../Models";

export class FileBuilder {
  protected id!: File["id"];
  protected fileName!: File["fileName"];
  protected url!: File["url"];

  private constructor() {}

  public static one() {
    return new FileBuilder();
  }

  public setId(id: FileBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setFilename(fileName: FileBuilder["fileName"]) {
    this.fileName = fileName;

    return this;
  }

  public setUrl(url: FileBuilder["url"]) {
    this.url = url;

    return this;
  }

  public build() {
    return new File(this.id, this.fileName, this.url);
  }
}

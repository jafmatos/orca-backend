export class BufferHelper {
  public static getBuffer(sizeInMB: number): Buffer {
    return Buffer.alloc(Math.ceil(sizeInMB * 1024 * 1024));
  }
}

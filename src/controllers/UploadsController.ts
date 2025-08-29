import { Request, Response } from "express";
import { Jetpack } from "Src/helpers/Jetpack";

export class UploadsController {
  public static async show(request: Request, response: Response) {
    return response.download(Jetpack.filePath(request.params.fileName));
  }
}

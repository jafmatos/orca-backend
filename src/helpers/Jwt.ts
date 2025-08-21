import jwt from "jsonwebtoken";
import { UserRoles } from "Src/database/entities/User.entity";

interface JwtData {
  id: string;
  role: UserRoles;
}

export class Jwt {
  public static tokenSecret = process.env.JWT_TOKEN_SECRET!;

  public static sign(payload: JwtData) {
    const token = jwt.sign(payload, this.tokenSecret);

    return token;
  }

  public static verify(token: string) {
    const data = jwt.verify(token, this.tokenSecret) as JwtData;

    return data;
  }
}

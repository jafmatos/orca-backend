import { dataSource } from "Src/database/data-source";
import { User } from "Src/database/entities/User.entity";
import { FindOptionsWhere } from "typeorm";

export type CreateUserAttributes = Omit<User, "id">;

export class UserService {
  private static readonly userRepository = dataSource.getRepository(User);

  public static async exists(where: FindOptionsWhere<User>) {
    return await this.userRepository.existsBy(where);
  }

  public static async findOneBy(where: FindOptionsWhere<User>) {
    return await this.userRepository.findOneBy(where);
  }

  public static async create(user: CreateUserAttributes) {
    return await this.userRepository.save(this.userRepository.create(user));
  }
}

import { dataSource } from "Src/database/data-source";
import { Plan } from "Src/database/entities/Plan.entity";

export class PlanService {
  private static readonly planRepository = dataSource.getRepository(Plan);

  public static async findAll() {
    return await this.planRepository.find();
  }

  public static async findById(id: string) {
    return await this.planRepository.findOneBy({
      id,
    });
  }
}

import { dataSource } from "Src/database/data-source";
import { Plan } from "Src/database/entities/Plan.entity";
import { DeepPartial } from "typeorm";

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

  public static async create(plan: DeepPartial<Plan>) {
    return await this.planRepository.save(this.planRepository.create(plan));
  }

  public static async update(plan: Plan, data: Partial<Plan>) {
    return await this.planRepository.save(this.planRepository.merge(plan, data));
  }

  public static async remove(plan: Plan) {
    return await this.planRepository.remove(plan);
  }
}

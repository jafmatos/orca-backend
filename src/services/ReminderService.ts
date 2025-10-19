import { dataSource } from "Src/database/data-source";
import { Reminder } from "Src/database/entities/Reminder.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  filter: {
    userId: string;
    text?: string;
    category?: string;
    referenceDateTime?: Date;
  };
  pagination: {
    skip: number;
    take: number;
  };
};

export class ReminderService {
  private static readonly reminderRepository = dataSource.getRepository(Reminder);

  public static async list(options: ListOptions) {
    const queryBuilder = this.reminderRepository
      .createQueryBuilder("reminder")
      .leftJoinAndSelect("reminder.category", "category")
      .where("(reminder.userId = :userId)", { userId: options.filter.userId })
      .andWhere("(reminder.removedAt IS NULL)");

    options.filter?.category && queryBuilder.andWhere("(category.id = :category)", { category: options.filter!.category! });

    options.filter?.referenceDateTime &&
      queryBuilder.andWhere("(DATE(reminder.referenceDateTime) = :referenceDateTime::date)", {
        referenceDateTime: options.filter.referenceDateTime,
      });

    options.filter?.text &&
      queryBuilder.andWhere(
        "(category.name ILIKE :text OR reminder.description ILIKE :text OR to_char(reminder.amount, 'FM999999999999999999D00') ILIKE REPLACE(:text, '.', ''))",
        { text: `%${options.filter!.text!}%` }
      );

    queryBuilder.orderBy("reminder.isActive", "DESC");
    queryBuilder.addOrderBy("reminder.referenceDateTime", "ASC");

    if (options?.pagination) {
      queryBuilder.skip(options.pagination.skip);
      queryBuilder.take(options.pagination.take);
    }

    const result = await queryBuilder.getManyAndCount();

    return result;
  }

  public static async findById(id: Reminder["id"]) {
    const reminder = await this.reminderRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    return reminder;
  }

  public static async findOneBy(where: FindOptionsWhere<Reminder>) {
    const reminder = await this.reminderRepository.findOne({
      where,
      withDeleted: true,
      relations: {
        user: true,
      },
    });

    return reminder;
  }

  public static async exists(id: Reminder["id"]) {
    const exists = await this.reminderRepository.existsBy({
      id,
    });

    return exists;
  }

  public static async create(data: DeepPartial<Reminder>) {
    const reminder = await this.reminderRepository.save(this.reminderRepository.create(data));

    return reminder;
  }

  public static async update(reminder: Reminder, data: DeepPartial<Reminder>) {
    const updatedReminder = await this.reminderRepository.save(this.reminderRepository.merge(reminder, data));

    return updatedReminder;
  }

  public static async remove(reminder: Reminder) {
    const removedReminder = await this.reminderRepository.remove(reminder);

    return removedReminder;
  }

  public static async softRemove(reminder: Reminder) {
    const removedReminder = await this.reminderRepository.update(reminder.id, {
      removedAt: () => "CURRENT_TIMESTAMP",
    });

    return removedReminder;
  }

  public static async recover(reminder: Reminder) {
    const recoveredReminder = await this.reminderRepository.update(reminder.id, {
      removedAt: null,
    });

    return recoveredReminder;
  }
}

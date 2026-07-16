import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';
import { Seeder } from '../Seeder';
import {
  Schedule,
  ScheduleFrequency,
} from '@/schedule/entities/schedule.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';

@Injectable()
export class TestingScheduleSeedService implements Seeder<Schedule[]> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  async seed() {
    const users = await this.userRepository.find({
      where: {
        role: UserRoles.User,
        isEmailConfirmed: true,
      },
      relations: {
        categories: true,
      },
    });

    const allSchedules: Schedule[] = [];

    for (const user of users) {
      const numSchedules = $faker.number.int({ min: 12, max: 18 });
      const userSchedulesData: DeepPartial<Schedule>[] = [];
      const categories = user.categories || [];

      for (let i = 0; i < numSchedules; i++) {
        const type =
          Math.random() < 0.9 ? EntryTypes.Expense : EntryTypes.Income;
        const matchingCategories = categories.filter((c) => c.type === type);
        const frequency =
          Math.random() < 0.8
            ? ScheduleFrequency.Monthly
            : ScheduleFrequency.Weekly;

        const time = `${String($faker.number.int({ min: 0, max: 23 })).padStart(2, '0')}:${String($faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}`;
        const timezone = 'America/Sao_Paulo';

        userSchedulesData.push(
          this.scheduleRepository.create({
            userId: user.id,
            type,
            amount:
              type === EntryTypes.Expense
                ? $faker.number.float({ fractionDigits: 2, min: 10, max: 1000 })
                : $faker.number.float({
                    fractionDigits: 2,
                    min: 100,
                    max: 5000,
                  }),
            description: $faker.finance
              .transactionDescription()
              .substring(0, 60),
            categoryId:
              Math.random() < 0.8 && matchingCategories.length > 0
                ? $faker.helpers.arrayElement(matchingCategories).id
                : null,
            frequency,
            time,
            timezone,
            dayOfMonth:
              frequency === ScheduleFrequency.Monthly
                ? $faker.number.int({ min: 1, max: 28 })
                : undefined,
            dayOfWeek:
              frequency === ScheduleFrequency.Weekly
                ? $faker.number.int({ min: 0, max: 6 })
                : undefined,
          }),
        );
      }

      const savedUserSchedules =
        await this.scheduleRepository.save(userSchedulesData);

      allSchedules.push(...savedUserSchedules);
    }

    return allSchedules;
  }
}

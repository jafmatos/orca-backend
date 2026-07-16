import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';
import { Seeder } from '../Seeder';
import { Entry } from '@/entry/entities/entry.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';

@Injectable()
export class TestingEntrySeedService implements Seeder<Entry[]> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
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

    const allEntries: Entry[] = [];

    for (const user of users) {
      const numEntries = $faker.number.int({ min: 300, max: 600 });
      const categories = user.categories!;
      const userEntriesData: DeepPartial<Entry>[] = [];

      for (let i = 0; i < numEntries; i++) {
        const threeMonthsAgo = new Date();

        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const type =
          Math.random() < 0.9 ? EntryTypes.Expense : EntryTypes.Income;
        const amount =
          type === EntryTypes.Expense
            ? $faker.number.float({ fractionDigits: 2, min: 1, max: 1000 })
            : $faker.number.float({ fractionDigits: 2, min: 10, max: 10000 });
        const when = $faker.date.between({
          from: threeMonthsAgo,
          to: new Date(),
        });

        const matchingCategories = categories.filter((c) => c.type === type);
        userEntriesData.push(
          this.entryRepository.create({
            type,
            amount,
            description: $faker.finance
              .transactionDescription()
              .substring(0, 60),
            categoryId:
              Math.random() < 0.9 && matchingCategories.length > 0
                ? $faker.helpers.arrayElement(matchingCategories).id
                : null,
            when,
            userId: user.id,
          }),
        );
      }

      const savedUserEntries = await this.entryRepository.save(userEntriesData);

      allEntries.push(...savedUserEntries);
    }

    return allEntries;
  }
}

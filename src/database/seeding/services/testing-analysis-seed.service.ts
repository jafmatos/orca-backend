import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, IsNull, Not, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';
import { Seeder } from '../Seeder';
import { Analysis } from '@/analysis/entities/analysis.entity';

@Injectable()
export class TestingAnalysisSeedService implements Seeder<Analysis[]> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
  ) {}

  async seed() {
    const users = await this.userRepository.find({
      where: {
        role: UserRoles.User,
        isEmailConfirmed: true,
        subscription: {
          id: Not(IsNull()),
        },
      },
    });

    const allAnalyses: Analysis[] = [];

    for (const user of users) {
      const numAnalyses = $faker.number.int({ min: 2, max: 5 });
      const userAnalysesData: DeepPartial<Analysis>[] = [];

      for (let i = 0; i < numAnalyses; i++) {
        userAnalysesData.push(
          this.analysisRepository.create({
            openaiId: `chatcmpl-${$faker.string.alphanumeric(29)}`,
            inputTokens: $faker.number.int({ min: 3000, max: 12000 }),
            outputTokens: $faker.number.int({ min: 100, max: 2000 }),
            userId: user.id,
            output: {
              diagnostic: $faker.lorem.paragraph(),
              issues: [
                {
                  title: $faker.lorem.sentence(),
                  effect: $faker.lorem.sentence(),
                },
              ],
              actions: [
                {
                  title: $faker.lorem.sentence(),
                  effect: $faker.lorem.sentence(),
                },
              ],
              expectation: $faker.lorem.paragraph(),
            },
            createdAt: $faker.date.recent({ days: 30 }),
          }),
        );
      }

      const savedUserAnalyses =
        await this.analysisRepository.save(userAnalysesData);

      allAnalyses.push(...savedUserAnalyses);
    }

    return allAnalyses;
  }
}

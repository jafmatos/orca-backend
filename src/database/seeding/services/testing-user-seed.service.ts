import { User, UserRoles } from '@/user/entities/user.entity';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeepPartial, Repository } from 'typeorm';
import { Seeder } from '../Seeder';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/.env.validate';

@Injectable()
export class TestingUserSeedService implements Seeder<User[]> {
  private readonly logger = new Logger(TestingUserSeedService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed() {
    const usersData = await Promise.all(
      [
        {
          name:
            this.configService.get('TESTING_SUPER_USER_NAME') || 'Super User',
          email:
            this.configService.get('TESTING_SUPER_USER_EMAIL') ||
            'superuser@orca.app',
          password:
            this.configService.get('TESTING_SUPER_USER_PASSWORD') || 'secret',
          role: UserRoles.SuperUser,
          isEmailConfirmed: true,
        },
        ...Array.from({ length: 10 }).map<DeepPartial<User>>(() => {
          return {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: process.env.TESTING_USER_DEFAULT_PASSWORD || 'secret',
            role: UserRoles.Admin,
            isEmailConfirmed: true,
          };
        }),
        ...Array.from({ length: 50 }).map<DeepPartial<User>>(() => {
          return {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: process.env.TESTING_USER_DEFAULT_PASSWORD || 'secret',
            role: UserRoles.User,
            isEmailConfirmed: Math.random() < 0.9,
            salaryDay: faker.number.int({ min: 1, max: 28 }),
          };
        }),
      ].map(async (user) => {
        return {
          ...user,
          password: await this.hashPassword(user.password!),
        };
      }),
    );

    const users = await this.userRepository.save(
      this.userRepository.create(usersData),
    );

    return users;
  }

  private async hashPassword(password: string) {
    const hashedPassword = await bcrypt.hash(password, 8);

    return hashedPassword;
  }
}

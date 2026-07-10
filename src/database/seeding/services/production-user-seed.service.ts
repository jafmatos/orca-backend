import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Seeder } from '../Seeder';

@Injectable()
export class ProductionUserSeedService implements Seeder {
  private readonly logger = new Logger(ProductionUserSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async seed() {
    await this.seedUser(
      process.env.APP_SUPER_USER_NAME,
      process.env.APP_SUPER_USER_EMAIL,
      process.env.APP_SUPER_USER_PASSWORD,
      UserRoles.SuperUser,
    );
  }

  private async seedUser(
    name?: string,
    email?: string,
    password?: string,
    role?: UserRoles,
  ) {
    if (!name || !email || !password || !role) {
      this.logger.warn(`Missing credentials for ${role}. Skipping seed.`);

      return;
    }

    const existing = await this.userRepository.findOne({ where: { email } });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        name,
        role,
        isEmailConfirmed: true,
      });

      await this.userRepository.save(user);

      this.logger.log(`Seeded production ${role}: ${email}`);
    }
  }
}

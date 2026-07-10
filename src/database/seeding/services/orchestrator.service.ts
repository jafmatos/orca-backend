import { Env } from '@/config/.env.validate';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ProductionUserSeedService } from './production-user-seed.service';
import { TestingPlanSeedService } from './testing-plan-seed.service';
import { TestingSubscriptionSeedService } from './testing-subscription-seed.service';
import { TestingUserSeedService } from './testing-user-seed.service';
import { TestingCategorySeedService } from './testing-category-seed.service';
import { TestingEntrySeedService } from './testing-entry-seed.service';
import { TestingAnalysisSeedService } from './testing-analysis-seed.service';
import { TestingScheduleSeedService } from './testing-schedule-seed.service';

@Injectable()
export class OrchestratorService implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<Env, true>,
    private readonly userProductionSeedService: ProductionUserSeedService,
    private readonly userTestingSeedService: TestingUserSeedService,
    private readonly planTestingSeedService: TestingPlanSeedService,
    private readonly subscriptionTestingSeedService: TestingSubscriptionSeedService,
    private readonly categoryTestingSeedService: TestingCategorySeedService,
    private readonly entryTestingSeedService: TestingEntrySeedService,
    private readonly analysisTestingSeedService: TestingAnalysisSeedService,
    private readonly scheduleTestingSeedService: TestingScheduleSeedService,
  ) {}

  async onApplicationBootstrap() {
    const NODE_ENV = this.configService.get('NODE_ENV');

    if (NODE_ENV === 'production') {
      return await this.userProductionSeedService.seed();
    }

    if (NODE_ENV !== 'testing' && !this.configService.get('SEED_ON_BOOTSTRAP'))
      return;

    await this.clearDatabase();

    await this.userTestingSeedService.seed();
    await this.planTestingSeedService.seed();
    await this.subscriptionTestingSeedService.seed();
    await this.categoryTestingSeedService.seed();
    await this.entryTestingSeedService.seed();
    await this.scheduleTestingSeedService.seed();
    await this.analysisTestingSeedService.seed();
  }

  async clearDatabase() {
    const entityManager = this.dataSource.manager;

    const entities = this.dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length === 0) return;

    await entityManager.query(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
  }
}

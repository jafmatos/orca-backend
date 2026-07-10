import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorService } from './services/orchestrator.service';
import { ProductionUserSeedService } from './services/production-user-seed.service';
import { TestingPlanSeedService } from './services/testing-plan-seed.service';
import { TestingUserSeedService } from './services/testing-user-seed.service';
import { Plan } from '@/subscription/entities/plan.entity';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { TestingSubscriptionSeedService } from './services/testing-subscription-seed.service';
import { Category } from '@/category/entities/category.entity';
import { TestingCategorySeedService } from './services/testing-category-seed.service';
import { TestingEntrySeedService } from './services/testing-entry-seed.service';
import { Entry } from '@/entry/entities/entry.entity';
import { Analysis } from '@/analysis/entities/analysis.entity';
import { TestingAnalysisSeedService } from './services/testing-analysis-seed.service';
import { Schedule } from '@/schedule/entities/schedule.entity';
import { TestingScheduleSeedService } from './services/testing-schedule-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Plan, Subscription, Category, Entry, Analysis, Schedule]),
  ],
  providers: [
    ProductionUserSeedService,
    TestingUserSeedService,
    TestingPlanSeedService,
    TestingSubscriptionSeedService,
    TestingCategorySeedService,
    TestingEntrySeedService,
    TestingAnalysisSeedService,
    TestingScheduleSeedService,
    OrchestratorService,
  ],
})
export class SeedingModule {}

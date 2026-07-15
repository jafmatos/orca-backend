import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativeOverviewController } from './controllers/administrative-overview.controller';
import { AdministrativeUserController } from './controllers/administrative-user.controller';
import { AdministrativePlanController } from './controllers/administrative-plan.controller';
import { AdministrativeOverviewService } from './services/administrative-overview.service';
import { AdministrativeUserService } from './services/administrative-user.service';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { Plan } from '@/subscription/entities/plan.entity';
import { SubscriptionModule } from '@/subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription, Plan]),
    SubscriptionModule,
  ],
  controllers: [
    AdministrativeOverviewController,
    AdministrativeUserController,
    AdministrativePlanController,
  ],
  providers: [AdministrativeOverviewService, AdministrativeUserService],
  exports: [AdministrativeOverviewService, AdministrativeUserService],
})
export class AdministrativeModule {}

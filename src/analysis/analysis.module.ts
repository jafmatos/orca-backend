import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analysis } from './entities/analysis.entity';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { AnalysisService } from './services/analysis.service';
import { AnalysisController } from './controllers/analysis.controller';
import { SubscribedGuard } from '@/auth/guards/subscribed.guard';
import { EntryModule } from '@/entry/entry.module';
import { CategoryModule } from '@/category/category.module';
import { ScheduleModule } from '@/schedule/schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis, Subscription]),
    EntryModule,
    CategoryModule,
    ScheduleModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, SubscribedGuard],
  exports: [AnalysisService],
})
export class AnalysisModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { Schedule } from './entities/schedule.entity';
import { ScheduleOccurrence } from './entities/schedule-occurrence.entity';
import { ScheduleService } from './services/schedule.service';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleOccurrenceController } from './controllers/schedule-occurrence.controller';
import { SchedulesProcessor } from './processors/schedules.processor';
import { NotificationsModule } from '@/notifications/notifications.module';
import { CategoryModule } from '@/category/category.module';
import { EntryModule } from '@/entry/entry.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, ScheduleOccurrence]),
    BullModule.registerQueue({
      name: 'schedules',
    }),
    BullBoardModule.forFeature({
      name: 'schedules',
      adapter: BullAdapter,
    }),
    NotificationsModule,
    CategoryModule,
    EntryModule,
    UserModule,
  ],
  controllers: [ScheduleController, ScheduleOccurrenceController],
  providers: [ScheduleService, SchedulesProcessor],
  exports: [ScheduleService],
})
export class ScheduleModule {}

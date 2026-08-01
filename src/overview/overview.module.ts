import { Module } from '@nestjs/common';
import { OverviewController } from './controllers/overview.controller';
import { OverviewService } from './services/overview.service';
import { CategoryModule } from '@/category/category.module';

@Module({
  imports: [CategoryModule],
  controllers: [OverviewController],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}

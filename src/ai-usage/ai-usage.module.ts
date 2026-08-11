import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsage } from './entities/ai-usage.entity';
import { AiUsageService } from './services/ai-usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage])],
  providers: [AiUsageService],
  exports: [AiUsageService],
})
export class AiUsageModule {}

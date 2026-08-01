import { AnalysisModule } from '@/analysis/analysis.module';
import { CategoryModule } from '@/category/category.module';
import { EntryModule } from '@/entry/entry.module';
import { OverviewModule } from '@/overview/overview.module';
import { ScheduleModule } from '@/schedule/schedule.module';
import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CHAT_TOOLS_TOKEN } from './tools/chat-tool.interface';
import { ChatToolsService } from './tools/chat-tools.service';
import { AnalysesReportTool } from './tools/implementations/analyses-report.tool';
import { ExpenseByCategoryTool } from './tools/implementations/expense-by-category.tool';
import { FinancialSummaryTool } from './tools/implementations/financial-summary.tool';
import { FutureSchedulesTool } from './tools/implementations/future-schedules.tool';
import { MonthlyEvolutionTool } from './tools/implementations/monthly-evolution.tool';
import { RecentTransactionsTool } from './tools/implementations/recent-transactions.tool';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    OverviewModule,
    AnalysisModule,
    EntryModule,
    ScheduleModule,
    CategoryModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatToolsService,
    FinancialSummaryTool,
    RecentTransactionsTool,
    FutureSchedulesTool,
    ExpenseByCategoryTool,
    AnalysesReportTool,
    MonthlyEvolutionTool,
    {
      provide: CHAT_TOOLS_TOKEN,
      useFactory: (
        t1: FinancialSummaryTool,
        t2: RecentTransactionsTool,
        t3: FutureSchedulesTool,
        t4: ExpenseByCategoryTool,
        t5: AnalysesReportTool,
        t6: MonthlyEvolutionTool,
      ) => [t1, t2, t3, t4, t5, t6],
      inject: [
        FinancialSummaryTool,
        RecentTransactionsTool,
        FutureSchedulesTool,
        ExpenseByCategoryTool,
        AnalysesReportTool,
        MonthlyEvolutionTool,
      ],
    },
  ],
})
export class ChatModule {}

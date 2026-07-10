import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SubscribedGuard } from '@/auth/guards/subscribed.guard';
import { CategoryService } from '@/category/services/category.service';
import { CSVGenerator } from '@/common/csv/csv-generator';
import type { PaginationOptions } from '@/common/decorators/pagination.decorator';
import { Pagination } from '@/common/decorators/pagination.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { EntryDataReadableExtractor } from '@/entry/extractors/entry-data-readable.extractor';
import { EntryDataTokenOptimizedExtractor } from '@/entry/extractors/entry-data-token-optimized.extractor';
import { EntryService } from '@/entry/services/entry.service';
import { ScheduleService } from '@/schedule/services/schedule.service';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { Analysis } from '../entities/analysis.entity';
import { AnalysisDataTokenOptimizedExtractor } from '../extractors/analysis-data-token-optimized.extractor';
import { AnalysisService } from '../services/analysis.service';

const queryOptimizedSchema = z
  .object({
    optimized: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
  })
  .optional();

type QueryOptimized = z.infer<typeof queryOptimizedSchema>;

@Controller('analyses')
@UseGuards(JwtAuthGuard, SubscribedGuard)
@Roles(UserRoles.User)
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly entryService: EntryService,
    private readonly categoryService: CategoryService,
    private readonly scheduleService: ScheduleService,
  ) {}

  @Get()
  async index(
    @AuthUser() user: User,
    @Pagination() pagination: PaginationOptions,
  ) {
    const [analyses, count] = await this.analysisService.list({
      filter: { userId: user.id },
      pagination: pagination.toQuery(),
    });

    const take = pagination.toQuery().take || 1;

    return {
      data: analyses,
      meta: {
        ...pagination.toResponse(),
        count,
        pages: Math.ceil(count / take) || 1,
      },
    };
  }

  @Get(':id')
  async show(
    @AuthUser() user: User,
    @Param('id') id: string,
  ) {
    const analysis = await this.analysisService.findOneBy({
      id,
      userId: user.id,
    });

    if (!analysis) throw new NotFoundException('Análise não encontrada');

    return { analysis };
  }

  @Post()
  async create(
    @AuthUser() user: User,
    @Query(new ZodValidationPipe(queryOptimizedSchema)) query: QueryOptimized,
  ) {
    const today = new Date();
    const threeMonthsAgo = new Date();

    today.setHours(23, 59, 59, 999);
    threeMonthsAgo.setHours(0, 0, 0, 0);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const entries = await this.entryService.list({
      filter: {
        userId: user.id,
        when: {
          ge: threeMonthsAgo,
          le: today,
        },
      },
      order: {
        column: 'when',
        mode: 'DESC',
      },
      pagination: { take: 99999 },
    });

    const extractor = query?.optimized
      ? new EntryDataTokenOptimizedExtractor()
      : new EntryDataReadableExtractor();

    const entriesCSV = await new CSVGenerator(extractor).generate(
      {
        category: 'Categoria',
        amount: 'Valor',
        description: 'Descrição',
        when: 'Data',
      },
      entries,
    );

    const summaryMap: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.type !== 'expense') continue;

      const date = new Date(entry.when);
      const monthStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      const catName = entry.category?.name || 'Sem categoria';
      const key = `${monthStr}|${catName}`;

      if (!summaryMap[key]) summaryMap[key] = 0;

      summaryMap[key] += entry.amount;
    }

    const summaryRows = Object.keys(summaryMap).map((key) => {
      const [month, category] = key.split('|');
      return { month, category, total: `-${summaryMap[key].toFixed(2)}` };
    });

    const monthlySummaryCSV = await new CSVGenerator({
      extract: (row: any) => row,
    }).generate(
      { month: 'Mês', category: 'Categoria', total: 'Total Gasto' },
      summaryRows,
    );

    const [recentAnalyses] = await this.analysisService.list({
      filter: { userId: user.id },
      pagination: { skip: 0, take: 10 },
    });

    const pastAnalyses: Analysis[] = [];

    if (recentAnalyses.length > 0) {
      pastAnalyses.push(recentAnalyses[0]);

      const mostRecentDate = new Date(recentAnalyses[0].createdAt);

      let olderAnalysis = recentAnalyses.find(
        (a) =>
          mostRecentDate.getTime() - new Date(a.createdAt).getTime() >
          15 * 24 * 60 * 60 * 1000,
      );

      if (!olderAnalysis && recentAnalyses.length > 1) {
        olderAnalysis = recentAnalyses[recentAnalyses.length - 1];
      }

      if (olderAnalysis) {
        pastAnalyses.push(olderAnalysis);
      }
    }

    const previousAnalysesCSV = await new CSVGenerator(
      new AnalysisDataTokenOptimizedExtractor(),
    ).generate(
      {
        date: 'Data',
        diagnostic: 'Diagnóstico',
        issues: 'Problemas',
        actions: 'Ações',
        expectation: 'Expectativa',
      },
      pastAnalyses,
    );

    const [categories] = await this.categoryService.list({
      filter: {
        userId: user.id,
        type: EntryTypes.Expense,
        when: {
          ge: user.currentCycle.start,
          le: user.currentCycle.end,
        },
      },
      pagination: { skip: undefined, take: undefined },
    });

    const categoriesCSV = await new CSVGenerator({
      extract: (category: any) => ({
        name: category.name || 'Sem categoria',
        spent: category.spent.toFixed(2),
        limit: category.limit ? category.limit.amount.toFixed(2) : 'Sem limite',
      }),
    }).generate(
      { name: 'Categoria', spent: 'Gasto no Ciclo Atual', limit: 'Limite' },
      categories,
    );

    const [schedules] = await this.scheduleService.list({
      filter: { userId: user.id },
      pagination: { skip: undefined, take: undefined },
    });

    const schedulesCSV = await new CSVGenerator({
      extract: (schedule: any) => ({
        type: schedule.type === 'expense' ? 'Despesa' : 'Receita',
        category: schedule.category?.name || 'Sem categoria',
        amount: schedule.amount.toFixed(2),
        description: schedule.description || 'Sem descrição',
        frequency: schedule.frequency === 'monthly' ? 'Mensal' : 'Semanal',
      }),
    }).generate(
      {
        type: 'Tipo',
        category: 'Categoria',
        amount: 'Valor',
        description: 'Descrição',
        frequency: 'Frequência',
      },
      schedules,
    );

    const aiResponse = await this.analysisService.generate({
      userGoal: user.financialGoal || null,
      userPayDay: user.salaryDay,
      userCurrentCycleStart: user.currentCycle.start,
      userCurrentCycleEnd: user.currentCycle.end,
      previousAnalysesCSV,
      entriesCSV,
      monthlySummaryCSV,
      categoriesCSV,
      schedulesCSV,
    });

    const analysis = await this.analysisService.create({
      openaiId: aiResponse.id,
      userId: user.id,
      inputTokens: aiResponse.usage?.prompt_tokens,
      outputTokens: aiResponse.usage?.completion_tokens,
      output: JSON.parse(aiResponse.output_text || '{}'),
    });

    return {
      analysis,
      input: {
        userGoal: user.financialGoal,
        userPayDay: user.salaryDay,
        entries: entriesCSV,
        categories: categoriesCSV,
        schedules: schedulesCSV,
        monthlySummary: monthlySummaryCSV,
        previousAnalyses: previousAnalysesCSV,
      },
    };
  }

  @Delete(':id')
  async destroy(
    @AuthUser() user: User,
    @Param('id') id: string,
  ) {
    const analysis = await this.analysisService.findOneBy({
      id,
      userId: user.id,
    });

    if (!analysis) throw new NotFoundException('Análise não encontrada');

    await this.analysisService.remove(analysis);

    return { analysis };
  }
}

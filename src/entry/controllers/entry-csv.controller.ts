import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CSVGenerator } from '@/common/csv/csv-generator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User } from '@/user/entities/user.entity';
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { EntryDataReadableExtractor } from '../extractors/entry-data-readable.extractor';
import { EntryDataTokenOptimizedExtractor } from '../extractors/entry-data-token-optimized.extractor';
import { EntryService } from '../services/entry.service';

const csvExportQuerySchema = z
  .object({
    filter: z
      .object({
        when: z
          .object({
            ge: z.string().optional(),
            le: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    optimized: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
  })
  .optional();

export type CSVExportQuery = z.infer<typeof csvExportQuerySchema>;

import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/user/entities/user.entity';

@ApiTags('EntryCSV')
@Controller('entries/export/csv')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class EntryCSVController {
  constructor(private readonly entryService: EntryService) {}

  @Get()
  async exportCSV(
    @AuthUser() user: User,
    @Res() response: Response,
    @Query(new ZodValidationPipe(csvExportQuerySchema)) query: CSVExportQuery,
  ) {
    const requestFilter = query?.filter || { when: {} };

    const entries = await this.entryService.list({
      filter: {
        userId: user.id,
        when: {
          ge: requestFilter.when?.ge
            ? new Date(requestFilter.when.ge)
            : user.currentCycle.start,
          le: requestFilter.when?.le
            ? new Date(requestFilter.when.le)
            : user.currentCycle.end,
        },
      },
      order: {
        column: 'when',
        mode: 'DESC',
      },
      pagination: { take: 999999 },
    });

    const extractor = query?.optimized
      ? new EntryDataTokenOptimizedExtractor()
      : new EntryDataReadableExtractor();

    const csv = await new CSVGenerator(extractor).generate(
      {
        category: 'Categoria',
        amount: 'Valor',
        description: 'Descrição',
        when: 'Data',
      },
      entries,
    );

    response.header('Content-Type', 'text/csv');
    response.attachment('lancamentos.csv');

    return response.send(csv);
  }
}

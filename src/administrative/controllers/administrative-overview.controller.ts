import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AdministrativeOverviewService,
  type AIUsageOptions,
} from '../services/administrative-overview.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserRoles } from '@/user/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

const kpisQuerySchema = z
  .object({
    filter: z
      .object({
        months: z.coerce.number().optional(),
      })
      .optional(),
  })
  .optional();

export type KPIsQuery = z.infer<typeof kpisQuerySchema>;

@ApiTags('AdministrativeOverview')
@Controller('administrative/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.Admin, UserRoles.SuperUser)
export class AdministrativeOverviewController {
  constructor(
    private readonly administrativeOverviewService: AdministrativeOverviewService,
  ) {}

  @Get('kpis')
  async getKPIs(
    @Query(new ZodValidationPipe(kpisQuerySchema)) query?: KPIsQuery,
  ) {
    const kpis = await this.administrativeOverviewService.getKPIs(query);
		
    return { kpis };
  }

  @Get('ai-usage')
  async getAiUsage(@Query() query?: AIUsageOptions) {
    const usage = await this.administrativeOverviewService.getAIUsage(query);

    return { usage };
  }
}

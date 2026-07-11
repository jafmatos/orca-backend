import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminOverviewService } from '../services/admin-overview.service';
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

@ApiTags('AdminOverview')
@Controller('admin/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.Admin, UserRoles.SuperUser)
export class AdminOverviewController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  @Get('kpis')
  async getKPIs(
    @Query(new ZodValidationPipe(kpisQuerySchema)) query?: KPIsQuery,
  ) {
    const kpis = await this.adminOverviewService.getKPIs(query);
    return { kpis };
  }
}

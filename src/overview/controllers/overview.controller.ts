import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CategoryService } from '@/category/services/category.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { User, UserRoles } from '@/user/entities/user.entity';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OverviewService } from '../services/overview.service';

@Controller('users/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class OverviewController {
  constructor(
    private readonly overviewService: OverviewService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get('kpis')
  async status(@AuthUser() user: User, @Query('filter') queryFilter: any) {
    const requestFilter =
      typeof queryFilter === 'string'
        ? JSON.parse(queryFilter)
        : queryFilter || { when: {} };

    const status = await this.overviewService.status({
      userId: user.id,
      when: {
        ge: requestFilter.when?.ge
          ? new Date(requestFilter.when.ge)
          : user.currentCycle.start,
        le: requestFilter.when?.le
          ? new Date(requestFilter.when.le)
          : user.currentCycle.end,
      },
    });

    return { status };
  }

  @Get('expense-by-category')
  async expenseByCategory(
    @AuthUser() user: User,
    @Query('filter') queryFilter: any,
  ) {
    const requestFilter =
      typeof queryFilter === 'string'
        ? JSON.parse(queryFilter)
        : queryFilter || { when: {} };

    const status = await this.overviewService.status({
      userId: user.id,
      when: {
        ge: requestFilter.when?.ge
          ? new Date(requestFilter.when.ge)
          : user.currentCycle.start,
        le: requestFilter.when?.le
          ? new Date(requestFilter.when.le)
          : user.currentCycle.end,
      },
    });

    const [categories] = await this.categoryService.list({
      filter: {
        type: EntryTypes.Expense,
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
        column: 'spent',
        mode: 'DESC',
      },
    });

    return { status, categories };
  }

  @Get('monthly-evolution')
  async monthlyEvolution(
    @AuthUser() user: User,
    @Query('months') monthsQuery: string,
  ) {
    const months = parseInt(monthsQuery, 10);

    const history = await this.overviewService.history({
      userId: user.id,
      months: !isNaN(months) ? months : undefined,
    });

    return { history };
  }
}

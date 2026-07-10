import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserRoles } from '@/user/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Pagination } from '@/common/decorators/pagination.decorator';
import type { PaginationOptions } from '@/common/decorators/pagination.decorator';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { Body, Param, Put } from '@nestjs/common';

const userListQuerySchema = z
  .object({
    filter: z
      .object({
        stripeId: z.string().optional(),
        role: z.enum(UserRoles).optional(),
        text: z.string().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        isEmailConfirmed: z
          .enum(['true', 'false'])
          .transform((val) => val === 'true')
          .optional(),
        subscription: z
          .object({
            status: z.enum(SubscriptionStatuses).optional(),
          })
          .optional(),
      })
      .optional(),
    order: z
      .object({
        entity: z.literal('user').optional().default('user'),
        column: z.string().optional().default('name'),
        mode: z.enum(['ASC', 'DESC']).optional().default('ASC'),
      })
      .optional(),
  })
  .optional();

type UserListQuery = z.infer<typeof userListQuerySchema>;

const updateUserRoleSchema = z.object({
  role: z.enum(UserRoles),
});

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.Admin, UserRoles.SuperUser)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async index(
    @Query(new ZodValidationPipe(userListQuerySchema)) query: UserListQuery,
    @Pagination() pagination: PaginationOptions,
  ) {
    const [users, count] = await this.adminUserService.find({
      filter: query?.filter,
      order: query?.order,
      pagination: pagination.toQuery(),
    });

    const take = pagination.toQuery().take || 10;

    return {
      data: users,
      meta: {
        count,
        pages: Math.ceil(count / take),
        ...pagination.toResponse(),
      },
    };
  }

  @Put(':id/role')
  @Roles(UserRoles.SuperUser)
  async updateRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema))
    data: z.infer<typeof updateUserRoleSchema>,
  ) {
    const user = await this.adminUserService.updateRole(id, data.role);
    return { user };
  }
}

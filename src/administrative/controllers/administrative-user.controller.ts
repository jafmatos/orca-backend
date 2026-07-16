import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { PaginationOptions } from '@/common/decorators/pagination.decorator';
import { Pagination } from '@/common/decorators/pagination.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { UserRoles } from '@/user/entities/user.entity';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AdministrativeUserService } from '../services/administrative-user.service';
import { PlanService } from '@/subscription/services/plan.service';
import { SubscriptionService } from '@/subscription/services/subscription.service';

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
        isBetaTester: z.boolean().optional(),
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

export type UserListQuery = z.infer<typeof userListQuerySchema>;

const updateUserSchema = z.object({
  role: z.enum(UserRoles).optional(),
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  isBetaTester: z.boolean().optional(),
});

const assignSubscriptionSchema = z.object({
  planId: z.uuid(),
  status: z.enum(SubscriptionStatuses).default(SubscriptionStatuses.Active),
  currentPeriodStart: z.iso
    .datetime()
    .optional()
    .nullable()
    .default(null)
    .transform((val) =>
      val === null ? null : val ? new Date(val) : undefined,
    ),
  currentPeriodEnd: z.iso
    .datetime()
    .optional()
    .nullable()
    .default(null)
    .transform((val) =>
      val === null ? null : val ? new Date(val) : undefined,
    ),
});

const updateSubscriptionSchema = z.object({
  status: z.enum(SubscriptionStatuses).optional(),
  currentPeriodStart: z.iso
    .datetime()
    .nullable()
    .optional()
    .transform((val) =>
      val === null ? null : val ? new Date(val) : undefined,
    ),
  currentPeriodEnd: z.iso
    .datetime()
    .nullable()
    .optional()
    .transform((val) =>
      val === null ? null : val ? new Date(val) : undefined,
    ),
  planId: z.uuid().optional(),
});

@ApiTags('AdministrativeUser')
@Controller('administrative/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdministrativeUserController {
  constructor(
    private readonly administrativeUserService: AdministrativeUserService,
    private readonly planService: PlanService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get()
  @Roles(UserRoles.Admin, UserRoles.SuperUser)
  async index(
    @Query(new ZodValidationPipe(userListQuerySchema)) query: UserListQuery,
    @Pagination() pagination: PaginationOptions,
  ) {
    const [users, count] = await this.administrativeUserService.find({
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

  @Put(':id')
  @Roles(UserRoles.SuperUser)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema))
    data: z.infer<typeof updateUserSchema>,
  ) {
    const user = await this.administrativeUserService.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updatedUser = await this.administrativeUserService.update(user, data);

    return { user: updatedUser };
  }

  @Post(':id/subscription')
  @Roles(UserRoles.Admin, UserRoles.SuperUser)
  async assignSubscription(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignSubscriptionSchema))
    data: z.infer<typeof assignSubscriptionSchema>,
  ) {
    const user = await this.administrativeUserService.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.subscription) {
      throw new BadRequestException('Este usuário já possui uma inscrição');
    }

    const plan = await this.planService.findById(data.planId);

    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const subscription = await this.subscriptionService.create({
      userId: id,
      planId: data.planId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    });

    return { subscription };
  }

  @Put(':id/subscription')
  @Roles(UserRoles.Admin, UserRoles.SuperUser)
  async updateSubscription(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSubscriptionSchema))
    data: z.infer<typeof updateSubscriptionSchema>,
  ) {
    const user = await this.administrativeUserService.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const subscription = user.subscription;

    if (!subscription) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    if (data.planId) {
      const plan = await this.planService.findById(data.planId);

      if (!plan) {
        throw new NotFoundException('Plano não encontrado');
      }
    }

    const updatedSubscription = await this.subscriptionService.update(
      subscription,
      data,
    );

    return { subscription: updatedSubscription };
  }
}

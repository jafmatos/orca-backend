import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CategoryService } from '@/category/services/category.service';
import {
  Pagination,
  type PaginationOptions,
} from '@/common/decorators/pagination.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ScheduleFrequency } from '../entities/schedule.entity';
import { ScheduleService } from '../services/schedule.service';

const zodOptionalCategorySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .max(40, 'O nome da categoria deve ter no máximo 40 caracteres')
      .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
      .optional(),
  })
  .or(z.undefined());

const createScheduleSchema = z
  .discriminatedUnion('frequency', [
    z.object({
      frequency: z.literal(ScheduleFrequency.Monthly),
      dayOfMonth: z
        .number()
        .min(1, 'Dia do mês inválido (válido: 1 - 28)')
        .max(28, 'Dia do mês inválido (válido: 1 - 28)'),
    }),
    z.object({
      frequency: z.literal(ScheduleFrequency.Weekly),
      dayOfWeek: z
        .number()
        .min(0, 'Dia da semana inválido')
        .max(6, 'Dia da semana inválido'),
    }),
  ])
  .and(
    z.object({
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (esperado HH:mm)'),
      timezone: z.string().min(1, 'Fuso horário é obrigatório'),
      type: z.enum([EntryTypes.Income, EntryTypes.Expense]),
      amount: z.number().min(0.01, 'Valor mínimo: R$ 0,01'),
      description: z
        .string()
        .max(60, 'A descrição deve ter no máximo 60 caracteres')
        .optional(),
      category: zodOptionalCategorySchema.optional().or(z.null()),
    }),
  );

const updateScheduleSchema = z
  .discriminatedUnion('frequency', [
    z.object({
      frequency: z.literal(ScheduleFrequency.Monthly),
      dayOfMonth: z
        .number()
        .min(1, 'Dia do mês inválido (válido: 1 - 28)')
        .max(28, 'Dia do mês inválido (válido: 1 - 28)')
        .optional(),
    }),
    z.object({
      frequency: z.literal(ScheduleFrequency.Weekly),
      dayOfWeek: z
        .number()
        .min(0, 'Dia da semana inválido')
        .max(6, 'Dia da semana inválido')
        .optional(),
    }),
  ])
  .and(
    z.object({
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (esperado HH:mm)').optional(),
      timezone: z.string().min(1, 'Fuso horário é obrigatório').optional(),
      type: z.enum([EntryTypes.Income, EntryTypes.Expense]).optional(),
      amount: z.number().min(0.01, 'Valor mínimo: R$ 0,01').optional(),
      description: z
        .string()
        .max(60, 'A descrição deve ter no máximo 60 caracteres')
        .optional(),
      category: zodOptionalCategorySchema.optional().or(z.null()),
    }),
  );

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get()
  async index(
    @AuthUser() user: User,
    @Pagination() pagination: PaginationOptions,
  ) {
    const queryPagination = pagination.toQuery();
    const [schedules, count] = await this.scheduleService.list({
      pagination: queryPagination,
      filter: {
        userId: user.id,
        when: { ge: user.currentCycle.start, le: user.currentCycle.end },
      },
    });

    const pages = Math.ceil(count / (queryPagination.take || 1));
    return {
      data: schedules.map((s) => s.toJSON()),
      meta: { ...pagination.toResponse(), count, pages },
    };
  }

  @Get(':id')
  async show(@Param('id') id: string, @AuthUser() user: User) {
    const schedule = await this.scheduleService.findOneBy(
      { id, userId: user.id },
      { start: user.currentCycle.start, end: user.currentCycle.end },
    );
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');
    return { schedule: schedule.toJSON() };
  }

  @Post()
  async store(
    @Body(new ZodValidationPipe(createScheduleSchema))
    data: z.infer<typeof createScheduleSchema>,
    @AuthUser() user: User,
  ) {
    let categoryId: string | null = null;

    if (data.category?.id) {
      const category = await this.categoryService.findOneBy({
        id: data.category.id,
        userId: user.id,
        type: data.type,
      });

      if (!category) throw new NotFoundException('Categoria não encontrada');
      categoryId = category.id;
    }

    const schedule = await this.scheduleService.create({
      ...data,
      userId: user.id,
      user: user,
      categoryId,
    });

    schedule.user = user;
		
    return { schedule: schedule.toJSON() };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    data: z.infer<typeof updateScheduleSchema>,
    @AuthUser() user: User,
  ) {
    const schedule = await this.scheduleService.findOneBy(
      { id, userId: user.id },
      { start: user.currentCycle.start, end: user.currentCycle.end },
    );
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    let categoryId: string | undefined | null = undefined;

    if (data.category?.id) {
      const typeStr = (data.type || schedule.type) as string;
      const categoryType =
        typeStr === EntryTypes.Expense ? EntryTypes.Expense : EntryTypes.Income;
      const category = await this.categoryService.findOneBy({
        id: data.category.id,
        userId: user.id,
        type: categoryType,
      });

      if (!category) throw new NotFoundException('Categoria não encontrada');
      categoryId = category.id;
    }

    const updated = await this.scheduleService.update(schedule, {
      ...data,
      categoryId: data.category === null ? null : categoryId,
    });

    updated.user = user;

    return { schedule: updated.toJSON() };
  }

  @Delete(':id')
  async destroy(@Param('id') id: string, @AuthUser() user: User) {
    const schedule = await this.scheduleService.findOneBy(
      { id, userId: user.id },
      { start: user.currentCycle.start, end: user.currentCycle.end },
    );

    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    const removed = await this.scheduleService.remove(schedule);

    return { schedule: removed.toJSON() };
  }
}

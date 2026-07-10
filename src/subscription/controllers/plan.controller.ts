import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PlanService } from '../services/plan.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/user/entities/user.entity';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string(),
  price: z.number('Informe um valor').min(0, 'Valor mínimo: R$ 0,00'),
  trialPeriodDays: z
    .number()
    .int()
    .min(0, 'O número de dias não pode ser negativo')
    .optional(),
  benefits: z.array(z.string()),
});

const updatePlanSchema = createPlanSchema.partial();

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async index() {
    const plans = await this.planService.findAll();
    return { plans };
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    const plan = await this.planService.findById(id);
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return { plan };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SuperUser)
  async store(
    @Body(new ZodValidationPipe(createPlanSchema))
    data: z.infer<typeof createPlanSchema>,
  ) {
    const plan = await this.planService.create(data);
    return { plan };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SuperUser)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePlanSchema))
    data: z.infer<typeof updatePlanSchema>,
  ) {
    const plan = await this.planService.findById(id);
    if (!plan) throw new NotFoundException('Plano não encontrado');

    const updatedPlan = await this.planService.update(plan, data);
    return { plan: updatedPlan };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.SuperUser)
  async destroy(@Param('id') id: string) {
    const plan = await this.planService.findById(id);
    if (!plan) throw new NotFoundException('Plano não encontrado');
    if (plan.activeSubscriptions > 0) {
      throw new ConflictException(
        'Não foi possível remover o plano pois há assinaturas ativas nele',
      );
    }

    await this.planService.remove(plan);
    return { plan };
  }
}

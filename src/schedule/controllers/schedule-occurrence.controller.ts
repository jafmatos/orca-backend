import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ScheduleService } from '../services/schedule.service';

const createOccurrenceSchema = z.object({
  when: z.iso.datetime('Data inválida'),
});

@ApiTags('ScheduleOccurrence')
@Controller('schedules/:id/occurrence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.User)
export class ScheduleOccurrenceController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async store(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOccurrenceSchema))
    data: z.infer<typeof createOccurrenceSchema>,
    @AuthUser() user: User,
  ) {
    const schedule = await this.scheduleService.findOneBy({
      id,
      userId: user.id,
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    const occurrence = await this.scheduleService.createOccurrence(
      schedule,
      new Date(data.when),
    );
    return { occurrence };
  }
}

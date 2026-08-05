import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ScheduleService } from '../services/schedule.service';
import { NotificationService } from '@/notifications/services/notification.service';
import { ScheduleStatus } from '../entities/schedule.entity';
import { UserService } from '@/user/services/user.service';

type BullScheduleNotificationJob = {
  id: string;
  scheduleId: string;
  beforeExpire?: boolean;
};

@Processor('schedules')
export class SchedulesProcessor {
  private readonly logger = new Logger(SchedulesProcessor.name);

  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @Process()
  async handleScheduleJob(job: Job<BullScheduleNotificationJob>) {
    try {
      const schedule = await this.scheduleService.findOneBy({
        id: job.data.scheduleId,
      });

      if (!schedule) throw new Error('Agendamento não encontrado');

      const user = await this.userService.findById(schedule.userId);

      if (!user) throw new Error('Usuário não encontrado');
      if (!user.acceptsNotifications) return;

      const cycles = schedule.getCycles();
      const hasPendingOrOverdue = cycles.some(
        (c) => c.status !== ScheduleStatus.Done,
      );
      if (!hasPendingOrOverdue && cycles.length > 0)
        throw new Error('O agendamento já foi concluído');

      const title = job.data.beforeExpire
        ? 'Lembre-se de concluir seu agendamento'
        : (
            {
              expense: 'Pagamento atrasado',
              income: 'Recebimento atrasado',
            } as Record<typeof schedule.type, string>
          )[schedule.type];
      const actionStatus = job.data.beforeExpire ? 'Vence amanhã' : 'Em atraso';

      const category = schedule.category?.name || 'Sem categoria';
      const description = schedule.description || 'Sem descrição';
      const amount = schedule.amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      await this.notificationService.sendNotification(user, {
        title,
        body: `[${category}] ${description} - ${amount} • ${actionStatus}`,
      });
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
    }
  }
}

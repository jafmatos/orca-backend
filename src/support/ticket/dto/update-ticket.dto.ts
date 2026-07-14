import { TicketStatuses } from '@/common/enums/ticket-statuses.enum';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateTicketSchema = z.object({
  status: z.enum(TicketStatuses).default(TicketStatuses.OPEN),
});

export class UpdateTicketDto extends createZodDto(UpdateTicketSchema) {}

export type UpdateTicketBody = z.infer<typeof UpdateTicketSchema>;

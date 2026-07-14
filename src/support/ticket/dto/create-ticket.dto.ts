import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTicketSchema = z.object({
  subject: z
    .string()
    .min(1, 'Informe o assunto')
    .max(60, 'Máximo 60 caracteres'),
  description: z
    .string()
    .min(1, 'Descreva o problema ou dúvida')
    .max(150, 'Máximo 150 caracteres'),
});

export class CreateTicketDto extends createZodDto(CreateTicketSchema) {}

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { ScheduleService } from '@/schedule/services/schedule.service';

@Injectable()
export class FutureSchedulesTool implements IChatTool {
  readonly name = 'buscar_agendamentos_futuros';

  constructor(private readonly scheduleService: ScheduleService) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Retorna os agendamentos fixos e recorrentes (receitas ou despesas programadas) configurados pelo usuário.',
      parameters: {
        type: 'object',
        properties: {
          pagination: {
            type: ['object', 'null'],
            description: 'Opções de paginação para controlar a quantidade máxima de agendamentos listados. Nulo para usar o padrão.',
            properties: {
              take: {
                type: ['number', 'null'],
                description: 'Quantidade de agendamentos a retornar (padrão 20, máximo 50). Nulo para usar o padrão.',
              },
            },
            required: ['take'],
            additionalProperties: false,
          },
        },
        required: ['pagination'],
        additionalProperties: false,
      } as any,
      strict: true,
    };
  }

  async execute(userId: string, args?: any): Promise<string> {
    const take = args?.pagination?.take && typeof args.pagination.take === 'number' ? Math.min(args.pagination.take, 50) : 20;

    const [schedules] = await this.scheduleService.list({
      filter: { userId },
      pagination: { take },
    });
    
    return JSON.stringify(
      schedules.map((s) => ({
        description: s.description,
        amount: s.amount,
        type: s.type,
        frequency: s.frequency,
      })),
    );
  }
}

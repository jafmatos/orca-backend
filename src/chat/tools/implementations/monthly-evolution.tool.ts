import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { OverviewService } from '@/overview/services/overview.service';

@Injectable()
export class MonthlyEvolutionTool implements IChatTool {
  readonly name = 'buscar_evolucao_mensal';

  constructor(private readonly overviewService: OverviewService) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Retorna a evolução histórica mês a mês das receitas, despesas e saldo do usuário ao longo dos meses.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: ['number', 'null'],
            description: 'Número de meses para retroceder e avaliar no histórico (máximo 24). Nulo para retornar o histórico completo desde o lançamento mais antigo.',
          },
        },
        required: ['months'],
        additionalProperties: false,
      } as any,
      strict: true,
    };
  }

  async execute(userId: string, args?: any): Promise<string> {
    const months = args?.months && typeof args.months === 'number' ? Math.min(args.months, 24) : undefined;

    const history = await this.overviewService.history({
      userId,
      months,
    });

    const totalExpense = history.reduce(
      (acc, curr) => acc + (Number(curr.totalExpense) || 0),
      0,
    );
    const totalIncome = history.reduce(
      (acc, curr) => acc + (Number(curr.totalIncome) || 0),
      0,
    );
    const totalBalance = history.reduce(
      (acc, curr) => acc + (Number(curr.balance) || 0),
      0,
    );

    return JSON.stringify({
      summary: {
        totalExpenseSum: Number(totalExpense.toFixed(2)),
        totalIncomeSum: Number(totalIncome.toFixed(2)),
        netBalanceSum: Number(totalBalance.toFixed(2)),
        monthsCount: history.length,
      },
      monthlyDetails: history,
    });
  }
}

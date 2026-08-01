import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { EntryService } from '@/entry/services/entry.service';

@Injectable()
export class RecentTransactionsTool implements IChatTool {
  readonly name = 'buscar_transacoes_recentes';

  constructor(private readonly entryService: EntryService) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Retorna a lista detalhada de transações (receitas e despesas) do usuário. Permite filtrar por datas (when), tipo do lançamento ou busca textual por descrição ou categoria, além de limitar a quantidade retornada.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: ['object', 'null'],
            description: 'Filtros aplicáveis às transações. Nulo para consultar sem filtros específicos.',
            properties: {
              when: {
                type: ['object', 'null'],
                description: 'Intervalo de datas. Nulo para não filtrar por período temporal.',
                properties: {
                  ge: {
                    type: ['string', 'null'],
                    description: 'Data inicial (maior ou igual a) no formato ISO.',
                  },
                  le: {
                    type: ['string', 'null'],
                    description: 'Data final (menor ou igual a) no formato ISO.',
                  },
                },
                required: ['ge', 'le'],
                additionalProperties: false,
              },
              type: {
                type: ['string', 'null'],
                description: 'Tipo de transação para filtrar: "income" para receitas ou "expense" para despesas. Nulo para retornar ambos os tipos.',
              },
              text: {
                type: ['string', 'null'],
                description: 'Termo textual para busca parcial na descrição da transação, no nome da categoria ou no valor financeiro. Nulo para não filtrar por texto.',
              },
            },
            required: ['when', 'type', 'text'],
            additionalProperties: false,
          },
          pagination: {
            type: ['object', 'null'],
            description: 'Opções de paginação para limitar os registros da consulta. Nulo para usar o padrão.',
            properties: {
              take: {
                type: ['number', 'null'],
                description: 'Quantidade máxima de transações a retornar (padrão 15, máximo 50). Nulo para o padrão.',
              },
            },
            required: ['take'],
            additionalProperties: false,
          },
        },
        required: ['filter', 'pagination'],
        additionalProperties: false,
      } as any,
      strict: true,
    };
  }

  async execute(userId: string, args?: any): Promise<string> {
    const take = args?.pagination?.take && typeof args.pagination.take === 'number' ? Math.min(args.pagination.take, 50) : 15;
    const filter: any = { userId };

    if (args?.filter?.when) {
      filter.when = {};
      if (args.filter.when.ge) filter.when.ge = new Date(args.filter.when.ge);
      if (args.filter.when.le) filter.when.le = new Date(args.filter.when.le);
    }

    if (args?.filter?.type === 'income' || args?.filter?.type === 'expense') {
      filter.type = args.filter.type;
    }

    if (args?.filter?.text && typeof args.filter.text === 'string') {
      filter.text = args.filter.text;
    }

    const entries = await this.entryService.list({
      filter,
      order: { column: 'when', mode: 'DESC' },
      pagination: { take },
    });
    
    const mapped = entries.map((e) => ({
      description: e.description,
      amount: Number(e.amount) || 0,
      type: e.type,
      when: e.when,
      category: e.category?.name,
    }));

    const totalIncome = mapped
      .filter((e) => e.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = mapped
      .filter((e) => e.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return JSON.stringify({
      summary: {
        totalIncomeInList: Number(totalIncome.toFixed(2)),
        totalExpenseInList: Number(totalExpense.toFixed(2)),
        count: mapped.length,
      },
      transactions: mapped,
    });
  }
}

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { CategoryService } from '@/category/services/category.service';
import { EntryTypes } from '@/common/enums/entry-types.enum';

@Injectable()
export class ListCategoriesTool implements IChatTool {
  readonly name = 'listar_categorias';

  constructor(private readonly categoryService: CategoryService) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Retorna a lista de todas as categorias cadastradas na conta do usuário (tanto de receitas quanto de despesas) com seus respectivos tipos e limites definidos. ATENÇÃO: Se o usuário quer saber QUANTO gastou por categoria ou EM QUAL categoria GASTOU MAIS, utilize a ferramenta buscar_gastos_por_categoria ao invés desta.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: ['object', 'null'],
            description: 'Filtros opcionais para listagem das categorias. Nulo para listar todas as categorias do usuário sem distinção de tipo.',
            properties: {
              type: {
                type: ['string', 'null'],
                description: 'Tipo de categoria para filtrar: "income" para receitas ou "expense" para despesas. Nulo para retornar ambos os tipos.',
              },
            },
            required: ['type'],
            additionalProperties: false,
          },
        },
        required: ['filter'],
        additionalProperties: false,
      } as any,
      strict: true,
    };
  }

  async execute(userId: string, args?: any): Promise<string> {
    let typeFilter: EntryTypes | undefined = undefined;

    if (args?.filter?.type === 'income') {
      typeFilter = EntryTypes.Income;
    } else if (args?.filter?.type === 'expense') {
      typeFilter = EntryTypes.Expense;
    }

    const [categories] = await this.categoryService.list({
      filter: {
        userId,
        type: typeFilter,
      },
    });

    const items = categories.map((c) => ({
      name: c.name,
      type: c.type,
      limit: c.limit?.amount ? Number(c.limit.amount) : null,
      isActive: c.isActive,
    }));

    const totalCount = items.length;
    const incomeCount = items.filter((c) => c.type === EntryTypes.Income || (c.type as unknown as string) === 'income').length;
    const expenseCount = items.filter((c) => c.type === EntryTypes.Expense || (c.type as unknown as string) === 'expense').length;

    return JSON.stringify({
      summary: {
        totalCategoriesCount: totalCount,
        incomeCategoriesCount: incomeCount,
        expenseCategoriesCount: expenseCount,
      },
      categories: items,
    });
  }
}

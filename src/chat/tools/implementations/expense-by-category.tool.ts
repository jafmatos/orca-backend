import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { CategoryService } from '@/category/services/category.service';
import { User } from '@/user/entities/user.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';

@Injectable()
export class ExpenseByCategoryTool implements IChatTool {
  readonly name = 'buscar_gastos_por_categoria';

  constructor(
    private readonly categoryService: CategoryService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Ferramenta OBRIGATÓRIA E PRINCIPAL para saber EM QUE CATEGORIA o usuário mais gastou ou para consultar despesas agrupadas por tipo/categoria (ex: alimentação, transporte, lazer, moradia, etc.). Retorna o total gasto em cada categoria e seus tetos de limite.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: ['object', 'null'],
            description: 'Filtros aplicáveis às categorias e aos lançamentos consolidados. Nulo para usar o padrão.',
            properties: {
              when: {
                type: ['object', 'null'],
                description: 'Intervalo de datas para somar os gastos de cada categoria. ATENÇÃO CRÍTICA: Se enviado como Nulo ou omitido, o sistema NÃO trará o histórico de todo o período; ao invés disso, filtrará obrigatoriamente APENAS O CICLO ATUAL do usuário.',
                properties: {
                  ge: {
                    type: ['string', 'null'],
                    description: 'Data inicial (maior ou igual a) no formato ISO. Deve iniciar às 00:00:00.000Z.',
                  },
                  le: {
                    type: ['string', 'null'],
                    description: 'Data final (menor ou igual a) no formato ISO. Deve terminar às 23:59:59.999Z.',
                  },
                },
                required: ['ge', 'le'],
                additionalProperties: false,
              },
            },
            required: ['when'],
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
    let ge: Date | undefined = undefined;
    let le: Date | undefined = undefined;

    if (args?.filter?.when?.ge && args?.filter?.when?.le) {
      ge = new Date(args.filter.when.ge);
      le = new Date(args.filter.when.le);
    } else {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        if (!user.currentCycle) user.setCurrentCycle();
        ge = user.currentCycle.start;
        le = user.currentCycle.end;
      }
    }

    const [categories] = await this.categoryService.list({
      filter: {
        type: EntryTypes.Expense,
        userId,
        when: ge && le ? { ge, le } : undefined,
      },
      order: {
        column: 'spent',
        mode: 'DESC',
      },
    });

    const items = categories.map((c) => ({
      category: c.name,
      spent: Number(c.spent) || 0,
      limit: c.limit?.amount ? Number(c.limit.amount) : null,
    }));

    return JSON.stringify({
      categories: items,
    });
  }
}

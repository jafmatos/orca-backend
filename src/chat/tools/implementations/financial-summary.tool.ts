import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { User } from '@/user/entities/user.entity';
import { OverviewService } from '@/overview/services/overview.service';

@Injectable()
export class FinancialSummaryTool implements IChatTool {
  readonly name = 'buscar_resumo_financeiro';

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly overviewService: OverviewService,
  ) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description: 'Retorna APENAS os números totais globais e saldo (KPIs): total geral de receitas, total de despesas e saldo. NÃO UTILIZE ESTA FERRAMENTA se o usuário perguntar sobre categorias específicas (alimentação, lazer, etc.) ou onde/em que categoria ele mais gastou (para isso, chame buscar_gastos_por_categoria).',
      parameters: {
        type: 'object',
        properties: {
          when: {
            type: ['object', 'null'],
            description: 'Intervalo de datas para consolidar os totais financeiros. ATENÇÃO CRÍTICA: Nulo NÃO significa todo o histórico; enviar nulo fará o sistema somar EXCLUSIVAMENTE O CICLO ATUAL do usuário.',
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
      } as any,
      strict: true,
    };
  }

  async execute(userId: string, args?: any): Promise<string> {
    let ge: Date | undefined = undefined;
    let le: Date | undefined = undefined;

    if (args?.when?.ge && args?.when?.le) {
      ge = new Date(args.when.ge);
      le = new Date(args.when.le);
    } else {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        if (!user.currentCycle) user.setCurrentCycle();
        ge = user.currentCycle.start;
        le = user.currentCycle.end;
      }
    }

    const data = await this.overviewService.status({
      userId,
      when: ge && le ? { ge, le } : undefined,
    });

    return JSON.stringify(data);
  }
}

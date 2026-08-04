import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool } from '../chat-tool.interface';
import { AnalysisService } from '@/analysis/services/analysis.service';

@Injectable()
export class AnalysesReportTool implements IChatTool {
  readonly name = 'buscar_relatorios_analises';

  constructor(private readonly analysisService: AnalysisService) {}

  getDefinition(): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name: this.name,
      description:
        'Retorna o histórico das análises financeiras anteriores com diagnósticos, problemas e planos de ação recomendados para o usuário.',
      parameters: {
        type: 'object',
        properties: {
          pagination: {
            type: ['object', 'null'],
            description:
              'Opções de paginação e limite para a consulta dos relatórios de análise. Nulo para usar os valores padrões.',
            properties: {
              take: {
                type: ['number', 'null'],
                description:
                  'Quantidade máxima de relatórios mais recentes a consultar (padrão 3, máximo 10). Nulo para usar o padrão.',
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
    const take =
      args?.pagination?.take && typeof args.pagination.take === 'number'
        ? Math.min(args.pagination.take, 10)
        : 3;

    const [analyses] = await this.analysisService.list({
      filter: { userId },
      pagination: { take },
    });

    return JSON.stringify(analyses);
  }
}

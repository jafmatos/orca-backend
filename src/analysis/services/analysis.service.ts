import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { User } from '@/user/entities/user.entity';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { Analysis } from '../entities/analysis.entity';
import { systemPrompt, userPrompt, UserPromptData } from '../prompts/analyses';

export interface AnalysisListOptions {
  filter: {
    userId: User['id'];
  };
  pagination?: {
    skip?: number;
    take?: number;
  };
}

const analysisSchema = z.object({
  diagnostic: z.string(),
  issues: z.array(
    z.object({
      title: z.string(),
      effect: z.string(),
      reason: z.string(),
    }),
  ),
  actions: z.array(
    z.object({
      title: z.string(),
      effect: z.string(),
    }),
  ),
  expectation: z.string(),
});

@Injectable()
export class AnalysisService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_KEY') || 'dummy-key',
    });
  }

  public async generate(params: UserPromptData) {
    if (process.env.NODE_ENV === 'testing') {
      return {
        id: 'mocked-openai-id',
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        output_text: JSON.stringify({
          diagnostic: 'Diagnóstico mockado para testes',
          issues: [
            {
              title: 'Problema 1',
              effect: 'Efeito do problema 1',
              reason: 'Razão do problema 1',
            },
          ],
          actions: [{ title: 'Ação 1', effect: 'Efeito da ação 1' }],
          expectation: 'Expectativa mockada',
        }),
      } as any;
    }

    const completion = await this.openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt(),
        },
        {
          role: 'user',
          content: userPrompt(params),
        },
      ],
      response_format: zodResponseFormat(analysisSchema, 'analysis'),
    });

    return {
      id: completion.id,
      usage: completion.usage,
      output_text: completion.choices[0].message.content,
    };
  }

  public list(options: AnalysisListOptions) {
    return this.analysisRepository.findAndCount({
      where: {
        userId: options.filter.userId,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: options.pagination?.skip,
      take: options.pagination?.take,
    });
  }

  public findOneBy(where: FindOptionsWhere<Analysis>) {
    return this.analysisRepository.findOneBy(where);
  }

  public create(entity: Partial<Analysis>) {
    return this.analysisRepository.save(entity);
  }

  public remove(entity: Analysis) {
    return this.analysisRepository.remove(entity);
  }
}

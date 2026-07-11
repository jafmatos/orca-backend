import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { systemPrompt, userPrompt } from '../prompts/smart-entries';
import { Category } from '@/category/entities/category.entity';

export interface SmartEntryGenerateArguments {
  text: string;
  categories: Category[];
  now: Date;
}

export interface SmartEntryGenerateReturnType {
  error: string | null;
  entries: {
    type: EntryTypes | null;
    amount: number | null;
    description: string | null;
    when: string | null;
    category: Category | null;
  }[];
}

@Injectable()
export class SmartEntryService {
  private openAIClient: OpenAI;
  private isTesting: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isTesting = this.configService.get<string>('NODE_ENV') === 'testing';
    this.openAIClient = new OpenAI({
      apiKey:
        this.configService.get<string>('OPENAI_KEY') ||
        (this.isTesting ? 'dummy' : undefined),
    });
  }

  async transcribeAudio(fileBuffer: Buffer, mimetype: string): Promise<string> {
    if (this.isTesting) {
      return 'Transcrição de teste';
    }

    const file = await OpenAI.toFile(fileBuffer, 'audio.m4a', {
      type: mimetype,
    });

    const transcription = await this.openAIClient.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    });

    return transcription.text;
  }

  async generate({
    text,
    categories,
    now,
  }: SmartEntryGenerateArguments): Promise<SmartEntryGenerateReturnType> {
    if (this.isTesting) {
      const category = categories.length > 0 ? categories[0] : null;

      return {
        error: null,
        entries: [
          {
            type: EntryTypes.Expense,
            amount: 35.5,
            description: "Lanche no McDonald's",
            when: new Date(now.getTime() - 86400000).toISOString(),
            category,
          },
        ],
      };
    }

    const categoriesList = categories
      .map((c) => `- ${c.name} (ID: ${c.id}, Tipo: ${c.type})`)
      .join('\n');

    const response = await this.openAIClient.responses.parse({
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt(),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt(text, now, categoriesList),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'smart_entry',
          schema: {
            type: 'object',
            properties: {
              error: {
                anyOf: [{ type: 'string' }, { type: 'null' }],
              },
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      anyOf: [
                        { type: 'string', enum: ['expense', 'income'] },
                        { type: 'null' },
                      ],
                    },
                    amount: {
                      anyOf: [{ type: 'number' }, { type: 'null' }],
                    },
                    description: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    when: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    category: {
                      type: 'object',
                      properties: {
                        id: {
                          anyOf: [{ type: 'string' }, { type: 'null' }],
                        },
                      },
                      additionalProperties: false,
                      required: ['id'],
                    },
                  },
                  required: [
                    'type',
                    'amount',
                    'description',
                    'when',
                    'category',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['error', 'entries'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const generatedEntryData = JSON.parse(
      response.output_text,
    ) as SmartEntryGenerateReturnType;

    if (generatedEntryData.entries) {
      generatedEntryData.entries.forEach((entry) => {
        if (
          !entry.category?.id ||
          !categories.some((category) => category.id === entry.category?.id)
        ) {
          entry.category = null;
        }
      });
    } else {
      generatedEntryData.entries = [];
    }

    return generatedEntryData;
  }
}

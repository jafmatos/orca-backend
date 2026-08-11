import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { systemPrompt, userPrompt } from '../prompts/smart-entries';
import { Category } from '@/category/entities/category.entity';
import { ChatCompletion } from 'openai/resources/chat/completions.js';
import sharp from 'sharp';
import { AiUsageService } from '@/ai-usage/services/ai-usage.service';
import { AiUsageType } from '@/ai-usage/entities/ai-usage.entity';

export interface SmartEntryGenerateArguments {
  text: string;
  categories: Category[];
  now: Date;
  images?: Array<{ buffer: Buffer; mimetype: string }>;
  userId: string;
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

  constructor(
    private readonly configService: ConfigService,
    private readonly aiUsageService: AiUsageService,
  ) {
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
    images,
    userId,
  }: SmartEntryGenerateArguments): Promise<
    [SmartEntryGenerateReturnType, ChatCompletion | null]
  > {
    if (this.isTesting) {
      const category = categories.length > 0 ? categories[0] : null;

      return [
        {
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
        },
        null,
      ] as unknown as [SmartEntryGenerateReturnType, ChatCompletion | null];
    }

    const categoriesList = categories
      .map((c) => `- ${c.name} (ID: ${c.id}, Tipo: ${c.type})`)
      .join('\n');

    const processedImages = await Promise.all(
      (images || []).map(async (img) => {
        if (!img.mimetype.startsWith('image/')) {
          return {
            type: 'image_url' as const,
            image_url: {
              url: `data:${img.mimetype};base64,${img.buffer.toString('base64')}`,
              detail: 'auto' as const,
            },
          };
        }

        const compressedBuffer = await sharp(img.buffer)
          .resize({ width: 1080, withoutEnlargement: true })
          .grayscale()
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:image/webp;base64,${compressedBuffer.toString('base64')}`,
            detail: 'auto' as const,
          },
        };
      }),
    );

    const response = await this.openAIClient.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: systemPrompt(),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt(text, now, categoriesList),
            },
            ...processedImages,
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'smart_entry',
          strict: true,
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
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            id: {
                              anyOf: [{ type: 'string' }, { type: 'null' }],
                            },
                          },
                          additionalProperties: false,
                          required: ['id'],
                        },
                        { type: 'null' },
                      ],
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
        },
      },
    });

    const generatedEntryData = JSON.parse(
      response.choices[0].message.content || '{}',
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

    if (response.usage) {
      await this.aiUsageService.registerUsage(
        userId,
        AiUsageType.SmartExtract,
        response.usage.prompt_tokens || 0,
        response.usage.completion_tokens || 0,
      );
    }

    return [generatedEntryData, response];
  }
}

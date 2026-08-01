import { AnalysisService } from '@/analysis/services/analysis.service';
import { User } from '@/user/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Repository } from 'typeorm';
import { chatSystemPrompt } from './prompts/chat.prompt';
import { ChatToolsService } from './tools/chat-tools.service';

type SendMessageOptions = {
  userId: string;
  threadId: string;
  content: string;
};

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private isTesting: boolean;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly analysisService: AnalysisService,
    private readonly chatToolsService: ChatToolsService,
  ) {
    this.isTesting = this.configService.get<string>('NODE_ENV') === 'testing';
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_KEY') || 'dummy-key',
    });
  }

  public async createThread(): Promise<OpenAI.Conversations.Conversation> {
    if (this.isTesting) {
      return {
        id: 'dummy-thread-id',
        created_at: Math.floor(Date.now() / 1000),
        metadata: {},
        object: 'conversation',
      };
    }

    return this.openai.conversations.create();
  }

  private async buildUserContext(userId: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) return '';

    if (!user.currentCycle) user.setCurrentCycle();

    const [[latestAnalysis]] = await this.analysisService.list({
      filter: { userId },
      pagination: { take: 1 },
    });

    const balanceStr = await this.chatToolsService.executeTool(
      'buscar_resumo_financeiro',
      userId,
    );

    let balanceData = { balance: 0, totalIncome: 0, totalExpense: 0 };

    try {
      balanceData = JSON.parse(balanceStr);
    } catch (e) {}

    return chatSystemPrompt(
      user.salaryDay,
      user.financialGoal || null,
      balanceData.balance,
      balanceData.totalIncome,
      balanceData.totalExpense,
      latestAnalysis?.output?.diagnostic || null,
      user.currentCycle.start,
      user.currentCycle.end,
      user.createdAt || new Date(),
    );
  }

  public async sendMessage(options: SendMessageOptions) {
    if (this.isTesting) {
      return {
        role: 'assistant',
        content: 'Resposta de teste do assistente.',
      };
    }

    const fullInstructions = await this.buildUserContext(options.userId);

    let response = await this.openai.responses.create({
      conversation: options.threadId,
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      instructions: fullInstructions,
      tools: this.chatToolsService.getTools(),
      input: [
        {
          role: 'user',
          content: options.content,
        },
      ],
    });

    while (true) {
      const toolCalls = response.output.filter(
        (item) => item.type === 'function_call',
      ) as OpenAI.Responses.ResponseFunctionToolCallItem[];

      if (toolCalls.length === 0) {
        break;
      }

      this.logger.log(
        `[AI Requested Tools] ${JSON.stringify(
          toolCalls.map((t) => ({
            name: t.name,
            call_id: t.call_id,
            arguments: t.arguments,
          })),
        )}`,
      );

      const functionOutputs: OpenAI.Responses.ResponseInputItem[] = [];

      for (const toolCall of toolCalls) {
        let parsedArgs = {};
        try {
          if (toolCall.arguments) {
            parsedArgs =
              typeof toolCall.arguments === 'string'
                ? JSON.parse(toolCall.arguments)
                : toolCall.arguments;
          }
        } catch (e) {}

        const functionOutput = await this.chatToolsService.executeTool(
          toolCall.name,
          options.userId,
          parsedArgs,
        );

        functionOutputs.push({
          type: 'function_call_output',
          call_id: toolCall.call_id,
          output: functionOutput,
        } as any);
      }

      response = await this.openai.responses.create({
        conversation: options.threadId,
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        instructions: fullInstructions,
        tools: this.chatToolsService.getTools(),
        input: functionOutputs,
      });
    }

    return {
      role: 'assistant',
      content: response.output_text || '',
    };
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IChatTool, CHAT_TOOLS_TOKEN } from './chat-tool.interface';

@Injectable()
export class ChatToolsService {
  private readonly logger = new Logger(ChatToolsService.name);

  constructor(@Inject(CHAT_TOOLS_TOKEN) private readonly tools: IChatTool[]) {}

  getTools(): OpenAI.Responses.Tool[] {
    return this.tools.map((tool) => tool.getDefinition());
  }

  async executeTool(name: string, userId: string, args?: any): Promise<string> {
    try {
      this.logger.log(
        `[Executing Tool] Name: "${name}" | User: ${userId} | Args: ${JSON.stringify(args || {})}`,
      );

      const tool = this.tools.find((t) => t.name === name);

      if (!tool) {
        this.logger.warn(`[Tool Not Found] Name: "${name}"`);
        return 'Ferramenta não encontrada.';
      }

      const data = await tool.execute(userId, args);

      this.logger.log(`[Tool Result] Name: "${name}" | Output: ${data}`);

      return data;
    } catch (err: any) {
      this.logger.error(
        `[Tool Error] Name: "${name}" | Error: ${err?.message || err}`,
        err?.stack,
      );
      return 'Erro ao executar ferramenta.';
    }
  }
}

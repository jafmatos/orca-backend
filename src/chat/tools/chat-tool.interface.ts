import OpenAI from 'openai';

export const CHAT_TOOLS_TOKEN = 'CHAT_TOOLS_TOKEN';

export interface IChatTool {
  readonly name: string;
  getDefinition(): OpenAI.Responses.Tool;
  execute(userId: string, args?: any): Promise<string>;
}

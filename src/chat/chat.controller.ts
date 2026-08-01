import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import * as OpenAIResources from 'openai/resources/conversations/conversations.js';
import z from 'zod';
import { ChatService } from './chat.service';

const SendMessageSchema = z.object({
  threadId: z.string().optional(),
  content: z.string().min(1),
});

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@Roles(UserRoles.User)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async sendMessage(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(SendMessageSchema))
    body: z.infer<typeof SendMessageSchema>,
  ) {
    let thread: OpenAIResources.Conversation | undefined = undefined;

    if (!body.threadId) {
      thread = await this.chatService.createThread();
    }

    const threadId = body.threadId || (thread ? thread.id : undefined);

    if (!threadId)
      throw new InternalServerErrorException('Conversa não encontrada');

    const message = await this.chatService.sendMessage({
      threadId,
      content: body.content,
      userId: user.id,
    });

    return { message, thread };
  }
}

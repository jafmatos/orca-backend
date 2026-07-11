import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User } from '@/user/entities/user.entity';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { PushSubscriptionProvider } from '../entities/push-subscription.entity';
import { PushSubscriptionService } from '../services/push-subscription.service';

const StorePushSubscriptionSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal(PushSubscriptionProvider.Webpush),
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    platform: z.string().optional(),
  }),
  z.object({
    provider: z.literal(PushSubscriptionProvider.Expo),
    expoPushToken: z.string(),
    platform: z.string().optional(),
  }),
]);

const RemovePushSubscriptionSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal(PushSubscriptionProvider.Webpush),
    endpoint: z.string(),
    platform: z.string().optional(),
  }),
  z.object({
    provider: z.literal(PushSubscriptionProvider.Expo),
    expoPushToken: z.string(),
    platform: z.string().optional(),
  }),
]);

@ApiTags('PushSubscription')
@Controller('push-subscriptions')
export class PushSubscriptionController {
  constructor(
    private readonly pushSubscriptionService: PushSubscriptionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async store(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(StorePushSubscriptionSchema))
    body: z.infer<typeof StorePushSubscriptionSchema>,
  ) {
    const existing = await this.pushSubscriptionService.findOneBy(
      body.provider === PushSubscriptionProvider.Webpush
        ? { endpoint: body.endpoint, userId: user.id }
        : { expoPushToken: body.expoPushToken, userId: user.id },
    );

    if (existing) {
      throw new BadRequestException('Assinatura já cadastrada');
    }

    await this.pushSubscriptionService.create({
      ...body,
      userId: user.id,
    });

    return {
      message: 'Assinatura cadastrada com sucesso',
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async remove(
    @AuthUser() user: User,
    @Query(new ZodValidationPipe(RemovePushSubscriptionSchema))
    query: z.infer<typeof RemovePushSubscriptionSchema>,
  ) {
    const pushSubscription = await this.pushSubscriptionService.findOneBy({
      ...query,
      userId: user.id,
    });

    if (!pushSubscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    await this.pushSubscriptionService.remove(pushSubscription);

    return {
      message: 'Assinatura removida com sucesso',
    };
  }
}

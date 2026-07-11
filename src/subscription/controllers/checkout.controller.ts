import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { PlanService } from '@/subscription/services/plan.service';
import { User } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import {
  Body,
  ConflictException,
  Controller,
  ImATeapotException,
  NotFoundException,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { StripeService } from '../services/stripe.service';

const createCheckoutSchema = z.discriminatedUnion('ui_mode', [
  z.object({
    ui_mode: z.literal('hosted'),
    success_url: z.string().optional(),
    cancel_url: z.string().optional(),
    planId: z.string().uuid(),
  }),
  z.discriminatedUnion('redirect_on_completion', [
    z.object({
      ui_mode: z.literal('embedded'),
      return_url: z.string(),
      success_url: z.undefined().or(z.never()).optional(),
      cancel_url: z.undefined().or(z.never()).optional(),
      redirect_on_completion: z.literal('always'),
      planId: z.string().uuid(),
    }),
    z.object({
      ui_mode: z.literal('embedded'),
      return_url: z.undefined().or(z.never()).optional(),
      success_url: z.undefined().or(z.never()).optional(),
      cancel_url: z.undefined().or(z.never()).optional(),
      redirect_on_completion: z.literal('never'),
      planId: z.string().uuid(),
    }),
  ]),
]);

@ApiTags('Checkout')
@Controller('stripe/checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  @Post()
  async store(
    @Body(new ZodValidationPipe(createCheckoutSchema))
    body: z.infer<typeof createCheckoutSchema>,
    @AuthUser() user: User,
  ) {
    const authUser = user;
    const { planId, ...stripeOptions } = body;

    if (
      authUser.subscription &&
      authUser.subscription.status !== SubscriptionStatuses.Canceled
    ) {
      throw new ConflictException('Você já tem uma assinatura ativa.');
    }

    const plan = await this.planService.findById(planId);
    if (!plan) throw new NotFoundException('Plano não encontrado');

    const session = await this.stripeService.createSubscriptionPaymentLink({
      plan,
      user: authUser,
      ...(stripeOptions as any),
    });

    return { session };
  }

  @Put()
  async update(@AuthUser() user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const authUser = user;
      const subscription =
        await this.stripeService.getCustomerSubscriptionByUserId(authUser.id);
      const customer = await this.stripeService.getCustomerByEmail(
        authUser.email,
      );

      if (!subscription || !customer) {
        throw new ImATeapotException('Pagamento não processado');
      }

      const trialStart = subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : undefined;
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined;
      const currentPeriodStart = new Date(
        subscription.items.data[0].current_period_start * 1000,
      );
      const currentPeriodEnd = new Date(
        subscription.items.data[0].current_period_end * 1000,
      );

      const updatedUser = await this.userService.update(
        authUser,
        {
          stripeId: customer.id,
          subscription: {
            stripeId: subscription.id,
            status: subscription.status as SubscriptionStatuses,
            trialStart,
            trialEnd,
            currentPeriodStart,
            currentPeriodEnd,
            planId: subscription.metadata.planId,
            userId: subscription.metadata.userId,
          },
        },
        { manager: queryRunner.manager },
      );

      await queryRunner.commitTransaction();
      return { subscription: updatedUser.subscription };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

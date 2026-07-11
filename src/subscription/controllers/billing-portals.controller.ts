import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User } from '@/user/entities/user.entity';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { StripeService } from '../services/stripe.service';

const createBillingPortalSchema = z.object({
  returnUrl: z.string(),
});

@ApiTags('BillingPortals')
@Controller('stripe/billing-portals')
@UseGuards(JwtAuthGuard)
export class BillingPortalsController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  async store(
    @Body(new ZodValidationPipe(createBillingPortalSchema))
    body: z.infer<typeof createBillingPortalSchema>,
    @AuthUser() user: User,
  ) {
    const session = await this.stripeService.createBillingPortalSession({
      user: user,
      returnUrl: body.returnUrl,
    });

    return { session };
  }
}

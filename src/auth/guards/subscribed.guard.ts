import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class SubscribedGuard implements CanActivate {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.SKIP_SUBSCRIPTION_CHECK === 'true') return true;

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    const subscription =
      user.subscription ??
      (await this.subscriptionRepository.findOneBy({ userId: user.id }));

    if (!subscription) {
      throw new ForbiddenException({
        message:
          'Bem-vindo! Este recurso requer uma assinatura. Veja nossos planos e comece hoje mesmo!',
        reason: 'NO_SUB',
      });
    }

    if (subscription.status === SubscriptionStatuses.Canceled) {
      throw new ForbiddenException({
        message:
          'Sua assinatura foi cancelada. Inscreva-se novamente para acessar sua conta',
        reason: 'NO_SUB',
      });
    }

    if (subscription.status === SubscriptionStatuses.Unpaid) {
      throw new HttpException(
        {
          message:
            'Sua fatura está pendente. Para retomar o acesso aos recursos do seu plano, entre no portal de assinatura e atualize seus dados de pagamento',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (subscription.status === SubscriptionStatuses.Paused) {
      throw new HttpException(
        {
          message:
            'Seu período de teste acabou e não encontramos um método de pagamento. Adicione uma forma de pagamento para reativar sua assinatura',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (!subscription.isActive) {
      throw new ForbiddenException();
    }

    return true;
  }
}

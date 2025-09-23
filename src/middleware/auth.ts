import { NextFunction, Request, Response } from "express";
import { Subscription } from "Src/database/entities/Subscription.entity";
import { UserRoles } from "Src/database/entities/User.entity";
import { ForbiddenError, UnauthorizedAccessError } from "Src/helpers/Errors";
import { PaymentRequiredError } from "Src/helpers/Errors/PaymentRequiredError";
import { Jwt } from "Src/helpers/Jwt";
import { UserService } from "Src/services/UserService";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";

const assertSubscribed = (subscription: Subscription, allowedStatuses: SubscriptionStatuses[]) => {
  if (!subscription)
    new ForbiddenError()
      .setMessage("Bem-vindo! Este recurso requer uma assinatura. Veja nossos planos e comece hoje mesmo!")
      .setReason("NO_SUB")
      .throw();

  if (subscription.status === SubscriptionStatuses.Canceled)
    new ForbiddenError()
      .setMessage("Você cancelou sua assinatura. Inscreva-se novamente para acessar sua conta")
      .setReason("NO_SUB")
      .throw();

  if (subscription.status === SubscriptionStatuses.Unpaid)
    new PaymentRequiredError(
      "Sua fatura está pendente. Para reativar sua conta, acesse seu portal de assinatura e atualize seus dados de pagamento"
    );

  if (subscription.status === SubscriptionStatuses.Paused)
    throw new PaymentRequiredError(
      "Seu período de teste acabou e não encontramos um método de pagamento. Adicione uma forma de pagamento para ativar sua assinatura."
    );

  if (!allowedStatuses.includes(subscription.status)) throw new ForbiddenError();
};

export const auth = (roles?: UserRoles[], options?: { withValidSubscription: boolean }) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const authorization = request.headers.authorization;
      const token = authorization?.split(" ")[1];

      if (!token) throw new UnauthorizedAccessError();

      const jwtData = Jwt.verify(token);

      const user = await UserService.findOneBy({
        id: jwtData.id,
        role: jwtData.role,
      });

      if (!user) throw new UnauthorizedAccessError();

      if (roles && !roles.includes(user.role)) new ForbiddenError().setMessage("Você não tem permissão para acessar este recurso").throw();

      if (options?.withValidSubscription)
        assertSubscribed(user.subscription!, [SubscriptionStatuses.Trialing, SubscriptionStatuses.Active, SubscriptionStatuses.PastDue]);

      request.auth = {
        user,
      };

      next();
    } catch (error) {
      throw new UnauthorizedAccessError();
    }
  };
};

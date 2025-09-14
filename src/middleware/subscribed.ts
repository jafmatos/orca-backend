import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedAccessError } from "Src/helpers/Errors";
import { PaymentRequiredError } from "Src/helpers/Errors/PaymentRequiredError";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";

export const subscribed = (allowedStatuses: SubscriptionStatuses[]) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.auth?.user) throw new UnauthorizedAccessError();

      const subscription = request.auth!.user.subscription;

      if (!subscription) throw new ForbiddenError("Bem-vindo! Este recurso requer uma assinatura. Veja nossos planos e comece hoje mesmo.");

      if (subscription.status === SubscriptionStatuses.Canceled)
        throw new ForbiddenError("Você cancelou sua assinatura. Inscreva-se novamente para acessar sua conta");

      if (subscription.status === SubscriptionStatuses.Unpaid)
        throw new PaymentRequiredError(
          "Sua fatura está pendente. Para reativar sua conta, acesse seu portal de assinatura e atualize seus dados de pagamento"
        );

      if (subscription.status === SubscriptionStatuses.Paused)
        throw new PaymentRequiredError(
          "Seu período de teste acabou e não encontramos um método de pagamento. Adicione uma forma de pagamento para ativar sua assinatura."
        );

      if (!allowedStatuses.includes(subscription.status)) throw new ForbiddenError();

      next();
    } catch (error) {
      throw new UnauthorizedAccessError();
    }
  };
};

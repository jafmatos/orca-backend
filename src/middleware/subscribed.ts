import { NextFunction, Request, Response } from "express";
import { Subscription } from "Src/database/entities/Subscription.entity";
import { ForbiddenError } from "Src/helpers/Errors";
import { PaymentRequiredError } from "Src/helpers/Errors/PaymentRequiredError";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";

const assertSubscribed = (subscription: Subscription) => {
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

  if (!subscription.isValid) throw new ForbiddenError();
};

export const subscribed = (request: Request, response: Response, next: NextFunction) => {
  assertSubscribed(request.auth!.user!.subscription!);

  next();
};

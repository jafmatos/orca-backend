import { Controller, Post, Put, Body, Param, NotFoundException, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UserService } from '@/user/services/user.service';
import { UserKeyService } from '@/auth/services/user-key.service';
import { EmailService } from '@/auth/services/email.service';
import { Bcrypt } from '@/common/helpers/bcrypt.helper';
import { Otp } from '@/common/helpers/otp.helper';
import { KeyTypes } from '@/auth/entities/user-key.entity';
import { EntityManager } from 'typeorm';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

const DeleteAccountSchema = z.object({
  confirmUrl: z.string().url('URL inválida'),
});

const DeleteAccountUpdateSchema = z.object({
  otp: z.string(),
});

const DeleteAccountResendSchema = z.object({
  confirmUrl: z.string().url('URL inválida'),
});

@Controller('delete-account')
export class DeleteAccountController {
  constructor(
    private readonly userService: UserService,
    private readonly userKeyService: UserKeyService,
    private readonly emailService: EmailService,
    private readonly entityManager: EntityManager,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async store(@Req() request: any, @Body(new ZodValidationPipe(DeleteAccountSchema)) body: z.infer<typeof DeleteAccountSchema>) {
    return this.entityManager.transaction(async (manager) => {
      const user = request.user;

      await this.userKeyService.delete({ userId: user.id, type: KeyTypes.DeleteAccount }, { manager });

      const otp = Otp.generate();
      const userKey = await this.userKeyService.create(
        {
          userId: user.id,
          type: KeyTypes.DeleteAccount,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        },
        { manager },
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;
      await this.emailService.sendDeleteAccountEmail({
        to: user.email,
        name: user.name,
        otp,
        confirmUrl,
      });

      return { key: userKey, confirmUrl };
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DeleteAccountUpdateSchema)) body: z.infer<typeof DeleteAccountUpdateSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({ id, type: KeyTypes.DeleteAccount });

      if (!key) throw new NotFoundException('Chave de acesso não encontrada');

      if (!Bcrypt.compare(body.otp, key.otp) || (key.expiresAt && new Date() > new Date(key.expiresAt))) {
        throw new UnauthorizedException('Código incorreto ou expirado');
      }

      const removedUser = await this.userService.remove(key.user!, { manager });
			
      await this.userKeyService.remove(key, { manager });

      // In legacy: removedUser.stripeId && await stripe.customers.del(removedUser.stripeId!);
      // We can implement Stripe integration later.

      return { user: removedUser };
    });
  }

  @Put('resend/:id')
  @UseGuards(JwtAuthGuard)
  async resend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DeleteAccountResendSchema)) body: z.infer<typeof DeleteAccountResendSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({ id, type: KeyTypes.DeleteAccount });
      if (!key) throw new NotFoundException('Chave de acesso não encontrada');

      const otp = Otp.generate();
      const userKey = await this.userKeyService.update(
        key,
        {
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        },
        { manager },
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;
      await this.emailService.sendDeleteAccountEmail({
        to: key.user!.email,
        name: key.user!.name,
        otp,
        confirmUrl,
      });

      return { key: userKey, confirmUrl };
    });
  }
}

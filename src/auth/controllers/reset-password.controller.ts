import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UserService } from '@/user/services/user.service';
import { AuthService } from '@/auth/services/auth.service';
import { UserKeyService } from '@/auth/services/user-key.service';
import { EmailService } from '@/auth/services/email.service';
import { Bcrypt } from '@/common/helpers/bcrypt.helper';
import { Otp } from '@/common/helpers/otp.helper';
import { KeyTypes } from '@/auth/entities/user-key.entity';
import { EntityManager } from 'typeorm';

const ResetPasswordSchema = z.object({
  confirmUrl: z.url('URL inválida'),
  email: z.email('Email inválido'),
});

const ResetPasswordUpdateSchema = z
  .object({
    otp: z.string(),
    password: z.string().min(6, 'Senha curta demais'),
    passwordConfirmation: z.string().min(6, 'Confirmação curta demais'),
  })
  .refine((body) => body.password === body.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Confirmação incorreta',
  });

const ResetPasswordResendSchema = z.object({
  confirmUrl: z.url('URL inválida'),
});

@ApiTags('ResetPassword')
@Controller('reset-password')
export class ResetPasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userKeyService: UserKeyService,
    private readonly emailService: EmailService,
    private readonly entityManager: EntityManager,
  ) {}

  @Post()
  async store(
    @Body(new ZodValidationPipe(ResetPasswordSchema))
    body: z.infer<typeof ResetPasswordSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const user = await this.userService.findOneWithBalanceBy({
        email: body.email,
      });
      if (!user)
        throw new NotFoundException('Não existe uma conta com este E-mail');

      const otp = Otp.generate();
      const userKey = await this.userKeyService.create(
        {
          userId: user.id,
          type: KeyTypes.ResetPassword,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        },
        { manager },
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;
      await this.emailService.sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        otp,
        confirmUrl,
      });

      return { user, key: userKey, confirmUrl };
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResetPasswordUpdateSchema))
    body: z.infer<typeof ResetPasswordUpdateSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.ResetPassword,
      });
      if (!key) throw new NotFoundException('Chave de acesso não encontrada');

      if (
        !Bcrypt.compare(body.otp, key.otp) ||
        (key.expiresAt && new Date() > new Date(key.expiresAt))
      ) {
        throw new UnauthorizedException('Código incorreto ou expirado');
      }

      const updatedUser = await this.userService.update(
        key.user!,
        {
          password: Bcrypt.hash(body.password),
          lastLoggedIn: new Date(),
        },
        { manager },
      );

      await this.userKeyService.remove(key, { manager });

      const token = this.authService.sign(key.user!);
      return { user: updatedUser, token };
    });
  }

  @Put('resend/:id')
  async resend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResetPasswordResendSchema))
    body: z.infer<typeof ResetPasswordResendSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.ResetPassword,
      });
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
      await this.emailService.sendResetPasswordEmail({
        to: key.user!.email,
        name: key.user!.name,
        otp,
        confirmUrl,
      });

      return { key: userKey, confirmUrl };
    });
  }
}

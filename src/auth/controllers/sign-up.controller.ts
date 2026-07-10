import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
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

const SignUpSchema = z
  .object({
    confirmUrl: z.string().url('URL inválida'),
    name: z.string(),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha curta demais'),
    passwordConfirmation: z.string().min(6, 'Confirmação curta demais'),
    acceptedTerms: z.boolean(),
  })
  .superRefine((body, ctx) => {
    if (body.password !== body.passwordConfirmation) {
      ctx.addIssue({
        path: ['passwordConfirmation'],
        message: 'Confirmação incorreta',
        code: z.ZodIssueCode.custom,
      });
    }
    if (!body.acceptedTerms) {
      ctx.addIssue({
        path: ['acceptedTerms'],
        message: 'É necessário aceitar os termos de uso',
        code: z.ZodIssueCode.custom,
      });
    }
  });

const SignUpUpdateSchema = z.object({
  otp: z.string(),
});

const SignUpResendSchema = z.object({
  confirmUrl: z.string().url('URL inválida'),
});

@Controller('sign-up')
export class SignUpController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userKeyService: UserKeyService,
    private readonly emailService: EmailService,
    private readonly entityManager: EntityManager,
  ) {}

  @Post()
  async store(
    @Body(new ZodValidationPipe(SignUpSchema))
    body: z.infer<typeof SignUpSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const hashedPassword = Bcrypt.hash(body.password);
      const existingUser = await this.userService.findOneWithBalanceBy({
        email: body.email,
      });
      if (existingUser?.isEmailConfirmed) {
        throw new ConflictException('Este e-mail já está em uso');
      }

      let user;
      if (existingUser) {
        user = await this.userService.update(
          existingUser,
          {
            name: body.name,
            email: body.email,
            password: hashedPassword,
          },
          { manager },
        );
      } else {
        user = await this.userService.create(
          {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            isEmailConfirmed: false,
            acceptedTermsAt: new Date(),
          },
          { manager },
        );
      }

      await this.userKeyService.delete(
        { userId: user.id, type: KeyTypes.SignUp },
        { manager },
      );

      const otp = Otp.generate();
      const userKey = await this.userKeyService.create(
        {
          userId: user.id,
          type: KeyTypes.SignUp,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        },
        { manager },
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;
      await this.emailService.sendSignUpEmail({
        to: user.email,
        name: user.name,
        otp,
        confirmUrl,
      });

      return { key: userKey, confirmUrl };
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SignUpUpdateSchema))
    body: z.infer<typeof SignUpUpdateSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.SignUp,
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
          isEmailConfirmed: true,
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
    @Body(new ZodValidationPipe(SignUpResendSchema))
    body: z.infer<typeof SignUpResendSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.SignUp,
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
      await this.emailService.sendSignUpEmail({
        to: key.user!.email,
        name: key.user!.name,
        otp,
        confirmUrl,
      });

      return { key: userKey, confirmUrl };
    });
  }
}

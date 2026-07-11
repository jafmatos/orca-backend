import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { KeyTypes } from '@/auth/entities/user-key.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { EmailService } from '@/auth/services/email.service';
import { UserKeyService } from '@/auth/services/user-key.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { Bcrypt } from '@/common/helpers/bcrypt.helper';
import { Otp } from '@/common/helpers/otp.helper';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User, UserRoles } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { z } from 'zod';

const DeleteAccountSchema = z.object({
  confirmUrl: z.url('URL inválida'),
});

const DeleteAccountUpdateSchema = z.object({
  otp: z.string(),
});

const DeleteAccountResendSchema = z.object({
  confirmUrl: z.url('URL inválida'),
});

@ApiTags('DeleteAccount')
@Controller('delete-account')
export class DeleteAccountController {
  constructor(
    private readonly userService: UserService,
    private readonly userKeyService: UserKeyService,
    private readonly emailService: EmailService,
    private readonly entityManager: EntityManager,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.User)
  async store(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(DeleteAccountSchema))
    body: z.infer<typeof DeleteAccountSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      await this.userKeyService.delete(
        { userId: user.id, type: KeyTypes.DeleteAccount },
        { manager },
      );

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.User)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DeleteAccountUpdateSchema))
    body: z.infer<typeof DeleteAccountUpdateSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.DeleteAccount,
      });

      if (!key) throw new NotFoundException('Chave de acesso não encontrada');

      if (
        !Bcrypt.compare(body.otp, key.otp) ||
        (key.expiresAt && new Date() > new Date(key.expiresAt))
      ) {
        throw new UnauthorizedException('Código incorreto ou expirado');
      }

      await this.userService.remove(key.user!, { manager });

      await this.userKeyService.remove(key, { manager });

      return { message: 'Conta excluída com sucesso' };
    });
  }

  @Put('resend/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.User)
  async resend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DeleteAccountResendSchema))
    body: z.infer<typeof DeleteAccountResendSchema>,
  ) {
    return this.entityManager.transaction(async (manager) => {
      const key = await this.userKeyService.findOneBy({
        id,
        type: KeyTypes.DeleteAccount,
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

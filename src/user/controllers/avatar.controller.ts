import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Jetpack } from '@/common/helpers/jetpack.helper';
import { User } from '@/user/entities/user.entity';
import { AvatarService } from '@/user/services/avatar.service';
import {
  BadRequestException,
  Controller,
  Delete,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';

@ApiTags('Avatar')
@Controller('users/me/avatar')
export class AvatarController {
  constructor(
    private readonly avatarService: AvatarService,
    private readonly entityManager: EntityManager,
  ) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.entityManager.transaction(async (manager) => {
      if (!file)
        throw new BadRequestException('É necessário enviar uma imagem');
      if (file.size > 5 * 1024 * 1024)
        throw new BadRequestException('Imagem muito grande. Limite: 5MB');

      const [type, extname] = file.mimetype.split('/');
      if (type !== 'image')
        throw new BadRequestException('É necessário enviar uma imagem');

      if (user.avatar) {
        await this.avatarService.remove(user.avatar, { manager });
      }

      const fileName = `${randomUUID()}.${extname}`;

      const avatar = await this.avatarService.create(
        {
          fileName,
          user,
        },
        { manager },
      );

      await Jetpack.upload({
        data: file.buffer,
        fileName,
      });

      user.avatar = avatar;

      return { user };
    });
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async destroy(@AuthUser() user: User) {
    return this.entityManager.transaction(async (manager) => {
      if (!user.avatar) return;

      await this.avatarService.remove(user.avatar, { manager });

      user.avatar = undefined;

      return { user };
    });
  }
}

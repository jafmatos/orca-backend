import { Controller, Put, Delete, Req, UseGuards, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarService } from '@/user/services/avatar.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Jetpack } from '@/common/helpers/jetpack.helper';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/user/entities/user.entity';

@Controller('users/avatar')
export class AvatarController {
  constructor(
    private readonly avatarService: AvatarService,
    private readonly entityManager: EntityManager,
  ) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async update(@Req() request: any, @UploadedFile() file: Express.Multer.File) {
    return this.entityManager.transaction(async (manager) => {
      const user: User = request.user;

      if (!file) throw new BadRequestException('É necessário enviar uma imagem');
      if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Imagem muito grande. Limite: 5MB');

      const [type, extname] = file.mimetype.split('/');
      if (type !== 'image') throw new BadRequestException('É necessário enviar uma imagem');

      if (user.avatar) {
        await this.avatarService.remove(user.avatar, { manager });
        // The beforeRemove hook on the entity removes the file physically
      }

      const fileName = `${uuidv4()}.${extname}`;

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

      // Reload user object to send response correctly formatted if necessary
      user.avatar = avatar;

      return { user };
    });
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async destroy(@Req() request: any) {
    return this.entityManager.transaction(async (manager) => {
      const user: User = request.user;

      if (!user.avatar) return;

      await this.avatarService.remove(user.avatar, { manager });

      user.avatar = undefined;

      return { user };
    });
  }
}

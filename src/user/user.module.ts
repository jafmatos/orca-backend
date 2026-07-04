import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '@/user/services/user.service';
import { AvatarService } from '@/user/services/avatar.service';
import { UserController } from '@/user/controllers/user.controller';
import { AvatarController } from '@/user/controllers/avatar.controller';
import { User } from '@/user/entities/user.entity';
import { Avatar } from '@/user/entities/avatar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Avatar])],
  controllers: [UserController, AvatarController],
  providers: [UserService, AvatarService],
  exports: [UserService, AvatarService],
})
export class UserModule {}

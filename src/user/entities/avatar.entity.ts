import { Entity, JoinColumn, OneToOne, BeforeRemove } from 'typeorm';
import { File } from '@/common/entities/file.entity';
import { User } from '@/user/entities/user.entity';
import { Jetpack } from '@/common/helpers/jetpack.helper';
import { Logger } from '@nestjs/common';

@Entity('avatars')
export class Avatar extends File {
  @OneToOne(() => User, (user) => user.avatar, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user?: User;

  @BeforeRemove()
  async removeFile() {
    try {
      await Jetpack.removeFile(this.fileName);
    } catch (error) {
      Logger.warn(`Failed to remove file: ${this.fileName}`, 'AvatarEntity');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DeepPartial } from 'typeorm';
import { Avatar } from '@/user/entities/avatar.entity';

@Injectable()
export class AvatarService {
  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(Avatar) : this.avatarRepository;
  }

  async create(
    data: DeepPartial<Avatar>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    const avatar = await repository.save(repository.create(data));

    return avatar;
  }

  async remove(avatar: Avatar, options?: { manager: EntityManager }) {
    const repository = this.getRepository(options?.manager);

    return await repository.remove(avatar);
  }
}

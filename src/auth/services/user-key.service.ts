import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  FindOptionsWhere,
  DeepPartial,
} from 'typeorm';
import { UserKey } from '@/auth/entities/user-key.entity';

@Injectable()
export class UserKeyService {
  constructor(
    @InjectRepository(UserKey)
    private readonly userKeyRepository: Repository<UserKey>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(UserKey) : this.userKeyRepository;
  }

  async findById(id: string) {
    return await this.userKeyRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async findOneBy(where: FindOptionsWhere<UserKey>) {
    return await this.userKeyRepository.findOne({
      where,
      relations: { user: true },
    });
  }

  async create(
    key: DeepPartial<UserKey>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.create(key));
  }

  async update(
    key: UserKey,
    data: Partial<UserKey>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.merge(key, data));
  }

  async remove(key: UserKey, options?: { manager: EntityManager }) {
    const repository = this.getRepository(options?.manager);
    return await repository.remove(key);
  }

  async delete(
    where: FindOptionsWhere<UserKey>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    return await repository.delete(where);
  }
}

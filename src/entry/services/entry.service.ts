import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  QueryRunner,
} from 'typeorm';
import { Entry } from '../entities/entry.entity';

export type EntryListOptions = {
  pagination?: {
    cursor?: { id: string; when: string };
    take: number;
  };
  filter: {
    userId: string;
    when?: {
      ge?: Date;
      le?: Date;
    };
    categoryId?: string | null;
    type?: string;
    text?: string;
  };
  order: {
    column: keyof Entry;
    mode: 'ASC' | 'DESC';
  };
};

@Injectable()
export class EntryService {
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
  ) {}

  async list(options: EntryListOptions): Promise<Entry[]> {
    const queryBuilder = this.entryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.category', 'category')
      .where('entry."userId" = :userId', { userId: options.filter.userId });

    if (options.filter.categoryId !== undefined) {
      if (options.filter.categoryId === null) {
        queryBuilder.andWhere('entry."categoryId" IS NULL');
      } else {
        queryBuilder.andWhere('entry."categoryId" = :categoryId', {
          categoryId: options.filter.categoryId,
        });
      }
    }

    if (options.filter.type) {
      queryBuilder.andWhere('entry.type = :type', {
        type: options.filter.type,
      });
    }

    if (options.filter.text) {
      queryBuilder.andWhere(
        '(entry.description ILIKE :text OR category.name ILIKE :text OR CAST(entry.amount AS TEXT) ILIKE :text)',
        { text: `%${options.filter.text}%` },
      );
    }

    if (options.filter.when?.ge) {
      queryBuilder.andWhere('entry.when >= :ge', {
        ge: options.filter.when.ge,
      });
    }

    if (options.filter.when?.le) {
      queryBuilder.andWhere('entry.when <= :le', {
        le: options.filter.when.le,
      });
    }

    if (options.pagination && options.pagination.cursor) {
      options.order.mode === 'DESC'
        ? queryBuilder.andWhere(
            '(entry.when < :cursorWhen OR (entry.when = :cursorWhen AND entry.id < :cursorId))',
            {
              cursorWhen: options.pagination.cursor.when,
              cursorId: options.pagination.cursor.id,
            },
          )
        : queryBuilder.andWhere(
            '(entry.when > :cursorWhen OR (entry.when = :cursorWhen AND entry.id > :cursorId))',
            {
              cursorWhen: options.pagination.cursor.when,
              cursorId: options.pagination.cursor.id,
            },
          );

      queryBuilder.take(options.pagination.take);
    }

    queryBuilder
      .orderBy(`entry.${options.order.column as string}`, options.order.mode)
      .addOrderBy('entry.id', options.order.mode);

    return queryBuilder.getMany();
  }

  async findOneBy(where: FindOptionsWhere<Entry>): Promise<Entry | null> {
    return this.entryRepository.findOne({
      where,
      relations: { category: true },
    });
  }

  async create(
    data: DeepPartial<Entry>,
    queryRunner?: QueryRunner,
  ): Promise<Entry> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(Entry)
      : this.entryRepository;
    const entry = repository.create(data);
    return repository.save(entry);
  }

  createWithoutSaving(data: DeepPartial<Entry>): Entry {
    return this.entryRepository.create(data);
  }

  async update(
    entry: Entry,
    data: DeepPartial<Entry>,
    queryRunner?: QueryRunner,
  ): Promise<Entry> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(Entry)
      : this.entryRepository;
    const updatedEntry = repository.merge(entry, data);
    return repository.save(updatedEntry);
  }

  async remove(entry: Entry): Promise<void> {
    await this.entryRepository.remove(entry);
  }
}

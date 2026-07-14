import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketStatuses } from '@/common/enums/ticket-statuses.enum';

export interface FindAndCountOptions {
  skip?: number;
  take?: number;
  where?: FindOptionsWhere<Ticket>;
}

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(data: DeepPartial<Ticket>) {
    return await this.ticketRepository.save(this.ticketRepository.create(data));
  }

  async findAll() {
    return await this.ticketRepository.find();
  }

  async findOneById(id: Ticket['id']) {
    return await this.ticketRepository.findOne({ where: { id } });
  }

  async findOneBy(where: FindOptionsWhere<Ticket>) {
    return await this.ticketRepository.findOne({ where });
  }

  async findAndCountBy(where: FindOptionsWhere<Ticket>) {
    return await this.ticketRepository.findAndCount({ where });
  }

  async findAndCount(options: FindAndCountOptions) {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (options.skip !== undefined) {
      query.skip(options.skip);
    }

    if (options.take !== undefined) {
      query.take(options.take);
    }

    if (options.where) query.where(options.where);

    query.addOrderBy(
      `CASE ticket.status
        WHEN '${TicketStatuses.OPEN}' THEN 1
        WHEN '${TicketStatuses.CLOSED}' THEN 2
        WHEN '${TicketStatuses.CANCELLED}' THEN 3
        ELSE 4
      END`,
      'ASC',
    );
    query.addOrderBy('ticket.createdAt', 'DESC');

    return await query.getManyAndCount();
  }

  async findBy(where: FindOptionsWhere<Ticket>) {
    return await this.ticketRepository.find({ where });
  }

  async update(id: Ticket['id'], data: DeepPartial<Ticket>) {
    return await this.ticketRepository.update(id, data);
  }

  async remove(id: Ticket['id']) {
    return await this.ticketRepository.softDelete(id);
  }
}

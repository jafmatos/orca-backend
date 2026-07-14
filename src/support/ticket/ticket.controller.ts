import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { TicketStatuses } from '@/common/enums/ticket-statuses.enum';
import { User, UserRoles } from '@/user/entities/user.entity';
import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param, Post,
	Put,
	Query
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateTicketDto, CreateTicketSchema } from './dto/create-ticket.dto';
import { TicketService } from './ticket.service';
import {
	Pagination,
	type PaginationOptions,
} from '@/common/decorators/pagination.decorator';

@Controller('ticket')
@Roles(UserRoles.User)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  create(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(CreateTicketSchema)) body: CreateTicketDto,
  ) {
    return this.ticketService.create({
      ...body,
      userId: user.id,
      status: TicketStatuses.OPEN,
    });
  }

  @Get()
  async findAll(
    @AuthUser() user: User,
    @Pagination() pagination: PaginationOptions,
    @Query('status') status?: TicketStatuses,
  ) {
    const [tickets, count] = await this.ticketService.findAndCount({
      where: {
        userId: user.id,
        status,
      },
      ...pagination.toQuery(),
    });

    return {
      data: tickets,
      meta: {
        ...pagination.toResponse(),
        count,
        pages: pagination.toQuery().take
          ? Math.ceil(count / pagination.toQuery().take!)
          : 1,
      },
    };
  }

  @Get(':id')
  async findOne(@AuthUser() user: User, @Param('id') id: string) {
    const ticket = await this.ticketService.findOneBy({
      userId: user.id,
      id,
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    return { ticket };
  }

  @Put(':id/cancel')
  async cancel(@AuthUser() user: User, @Param('id') id: string) {
    const ticket = await this.ticketService.findOneBy({
      userId: user.id,
      id,
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    await this.ticketService.update(id, {
      status: TicketStatuses.CANCELLED,
    });

    return { message: 'Ticket cancelado com sucesso' };
  }
}

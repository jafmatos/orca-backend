import { Module } from '@nestjs/common';
import { TicketModule } from './ticket/ticket.module';
import { TicketService } from './ticket/ticket.service';

@Module({
  imports: [TicketModule],
  exports: [TicketService],
})
export class SupportModule {}

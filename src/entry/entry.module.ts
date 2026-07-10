import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry } from './entities/entry.entity';
import { EntryService } from './services/entry.service';
import { EntryController } from './controllers/entry.controller';
import { EntryCSVController } from './controllers/entry-csv.controller';
import { SmartEntryService } from './services/smart-entry.service';
import { CategoryModule } from '@/category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([Entry]), CategoryModule],
  controllers: [EntryController, EntryCSVController],
  providers: [EntryService, SmartEntryService],
  exports: [EntryService],
})
export class EntryModule {}

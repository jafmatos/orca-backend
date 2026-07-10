import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Limit } from './entities/limit.entity';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { LimitService } from './services/limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Limit])],
  controllers: [CategoryController],
  providers: [CategoryService, LimitService],
  exports: [CategoryService, LimitService],
})
export class CategoryModule {}

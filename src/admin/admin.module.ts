import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';
import { AdminOverviewService } from './services/admin-overview.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminOverviewController } from './controllers/admin-overview.controller';
import { AdminUserController } from './controllers/admin-user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminOverviewController, AdminUserController],
  providers: [AdminOverviewService, AdminUserService],
  exports: [AdminOverviewService, AdminUserService],
})
export class AdminModule {}

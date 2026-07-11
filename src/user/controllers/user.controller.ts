import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';

const UserUpdateSchema = z
  .object({
    name: z.string().optional(),
    salaryDay: z.number().int().optional(),
    acceptsNotifications: z.boolean().optional(),
    financialGoal: z.string().nullable().optional(),
  })
  .strict();

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async update(
    @AuthUser() user: User,
    @Body(new ZodValidationPipe(UserUpdateSchema))
    body: z.infer<typeof UserUpdateSchema>,
  ) {
    await this.userService.update(user, body);

    const updatedUser = await this.userService.findOneWithBalanceBy({
      id: user.id,
    });

    return { user: updatedUser };
  }
}

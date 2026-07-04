import { Controller, Put, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UserService } from '@/user/services/user.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/user/entities/user.entity';

const UserUpdateSchema = z
  .object({
    name: z.string().optional(),
    periodGe: z.string().datetime().optional(),
    periodLe: z.string().datetime().optional(),
    periodReferenceDay: z.number().int().optional(),
    acceptsNotifications: z.boolean().optional(),
    financialGoal: z.string().nullable().optional(),
  });

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(@Req() request: any, @Body(new ZodValidationPipe(UserUpdateSchema)) body: z.infer<typeof UserUpdateSchema>) {
    const user: User = request.user;

    // We do manual refinement here instead of superRefine to avoid needing DB injection inside Zod
    if (body.periodGe || body.periodLe) {
      const mergedUser = {
        ...user,
        ...body,
      };

      const periodGe = new Date(mergedUser.periodGe!);
      const periodLe = new Date(mergedUser.periodLe!);

      if (periodGe > periodLe) {
        throw new BadRequestException('A data de início não pode ser maior que a de fechamento');
      }
    }

    await this.userService.update(user, {
      ...body,
      ...(body.periodGe && { periodGe: new Date(body.periodGe) }),
      ...(body.periodLe && { periodLe: new Date(body.periodLe) }),
    });

    const updatedUser = await this.userService.findOneWithBalanceBy({ id: user.id });

    return { user: updatedUser };
  }
}

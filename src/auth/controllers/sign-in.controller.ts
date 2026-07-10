import { AuthUser } from '@/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthService } from '@/auth/services/auth.service';
import { Bcrypt } from '@/common/helpers/bcrypt.helper';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { User } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  ImATeapotException,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string(),
});

type SignInDto = z.infer<typeof SignInSchema>;

@Controller('sign-in')
export class SignInController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async show(@AuthUser() user: User) {
    if (!user) throw new UnauthorizedException();

    return { user };
  }

  @Post()
  async store(@Body(new ZodValidationPipe(SignInSchema)) body: SignInDto) {
    const user = await this.userService.findOneWithBalanceBy({
      email: body.email,
    });

    if (user && !user.isEmailConfirmed) {
      throw new ConflictException(
        'Você precisa confirmar o E-mail antes de acessar sua conta. Verifique sua caixa de entrada!',
      );
    }

    if (!user || !Bcrypt.compare(body.password, user.password)) {
      throw new ImATeapotException('E-mail ou senha incorretos');
    }

    await this.userService.update(user, {
      lastLoggedIn: new Date(),
    });

    const token = this.authService.sign(user);

    return { user, token };
  }
}

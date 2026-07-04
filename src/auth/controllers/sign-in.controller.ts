import { Controller, Post, Get, Body, Req, UseGuards, UnauthorizedException, ConflictException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UserService } from '@/user/services/user.service';
import { AuthService } from '@/auth/services/auth.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Bcrypt } from '@/common/helpers/bcrypt.helper';

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
  async show(@Req() request: any) {
    const user = request.user;
    if (!user) throw new UnauthorizedException();

    // In legacy, it triggered an event. We can omit it for now or implement EventEmitter2 later.
    return { user };
  }

  @Post()
  async store(@Body(new ZodValidationPipe(SignInSchema)) body: SignInDto) {
    const user = await this.userService.findOneWithBalanceBy({ email: body.email });

    if (user && !user.isEmailConfirmed) {
      throw new ConflictException('Você precisa confirmar o E-mail antes de acessar sua conta. Verifique sua caixa de entrada!');
    }

    if (!user || !Bcrypt.compare(body.password, user.password)) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.userService.update(user, {
      lastLoggedIn: new Date(),
    });

    const token = this.authService.sign(user);

    return { user, token };
  }
}

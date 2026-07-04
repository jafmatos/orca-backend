import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '@/auth/services/auth.service';
import { UserKeyService } from '@/auth/services/user-key.service';
import { EmailService } from '@/auth/services/email.service';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { UserKey } from '@/auth/entities/user-key.entity';
import { UserModule } from '@/user/user.module';
import { SignInController } from '@/auth/controllers/sign-in.controller';
import { SignUpController } from '@/auth/controllers/sign-up.controller';
import { ResetPasswordController } from '@/auth/controllers/reset-password.controller';
import { DeleteAccountController } from '@/auth/controllers/delete-account.controller';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([UserKey]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    SignInController,
    SignUpController,
    ResetPasswordController,
    DeleteAccountController,
  ],
  providers: [AuthService, UserKeyService, EmailService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

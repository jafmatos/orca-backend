import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  sign(user: User) {
    return this.jwtService.sign({
      id: user.id,
      role: user.role,
    });
  }
}

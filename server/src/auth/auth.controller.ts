import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return { token: this.authService.loginReader(dto.password) };
  }

  @Post('admin/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  adminLogin(@Body() dto: LoginDto) {
    return { token: this.authService.loginAdmin(dto.password) };
  }
}

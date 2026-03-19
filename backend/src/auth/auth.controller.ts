import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../core/decorators/public.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.authService.health();
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MicrosoftTokenVerifierService } from './services/microsoft-token-verifier.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, MicrosoftTokenVerifierService],
  exports: [AuthService, MicrosoftTokenVerifierService],
})
export class AuthModule {}

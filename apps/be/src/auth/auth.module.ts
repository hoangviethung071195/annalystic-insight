import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../db/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

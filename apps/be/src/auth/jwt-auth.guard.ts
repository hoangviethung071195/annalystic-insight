import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is required');
    }

    const token = authHeader.split(' ')[1];
    const payload = this.authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      id: payload.userId,
      email: payload.email,
    };

    return true;
  }
}

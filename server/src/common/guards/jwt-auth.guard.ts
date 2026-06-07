import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice(7).trim();

    try {
      const payload = this.jwt.verify<{ scope?: string }>(token);
      if (payload.scope !== 'reader' && payload.scope !== 'admin') {
        throw new UnauthorizedException('Invalid token scope');
      }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

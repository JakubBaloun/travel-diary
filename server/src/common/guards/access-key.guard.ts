import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AccessKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-access-key'];

    if (!key || key !== process.env.ACCESS_KEY) {
      throw new UnauthorizedException('Invalid or missing access key');
    }

    return true;
  }
}

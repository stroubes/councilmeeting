import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../constants/permissions.constants';

@Injectable()
export class InCameraAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      query?: Record<string, string | undefined>;
      params?: Record<string, string | undefined>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User context not available');
    }

    const flag = request.query?.inCamera ?? request.params?.inCamera;
    const isInCamera = flag === 'true' || flag === '1';

    if (!isInCamera) {
      return true;
    }

    const canAccess = user.permissions.includes(PERMISSIONS.MEETING_READ_IN_CAMERA);
    if (!canAccess) {
      throw new ForbiddenException('In-camera access denied');
    }

    return true;
  }
}

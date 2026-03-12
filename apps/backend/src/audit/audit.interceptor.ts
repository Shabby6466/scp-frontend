import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service.js';
import { AUDIT_KEY } from './audit.decorator.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditAction = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!auditAction) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const entityId = request.params?.id;

    return next.handle().pipe(
      tap((response) => {
        if (user?.id) {
          const resultId =
            entityId ?? (response && typeof response === 'object' && 'id' in response ? (response as Record<string, unknown>).id : undefined);

          this.auditService.log({
            action: auditAction,
            entityId: resultId as string | undefined,
            userId: user.id,
            details: {
              method: request.method,
              path: request.url,
              ip: request.ip,
            },
          }).catch(() => {});
        }
      }),
    );
  }
}

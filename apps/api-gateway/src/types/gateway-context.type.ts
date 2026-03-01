import type { JwtPayload } from 'jsonwebtoken';
import type { RequestContext } from '@hyperlocal/shared';

export interface GatewayRequestContext extends RequestContext {
  correlationId: string;
  sessionId: string;
  startTime: number;
  user?: JwtPayload;
}

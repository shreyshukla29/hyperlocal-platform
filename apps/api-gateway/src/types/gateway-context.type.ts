import type { JwtPayload } from 'jsonwebtoken';

export interface GatewayRequestContext {
  correlationId: string;
  sessionId: string;
  startTime: number;
  user?: JwtPayload;
}

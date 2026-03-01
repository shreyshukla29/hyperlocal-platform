/**
 * Request context attached by gateway and backends.
 * Gateway sets correlationId, sessionId, startTime, and optionally user (JWT payload).
 * Other services can read these and add their own fields.
 */
export interface RequestContext {
  correlationId?: string;
  sessionId?: string;
  startTime?: number;
  user?: unknown;
  [key: string]: unknown;
}

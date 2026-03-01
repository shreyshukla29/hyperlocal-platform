/**
 * Global Express Request context. Use via req.context in any app that
 * references this file (see apps' src/express.d.ts).
 */
interface RequestContext {
  correlationId?: string;
  sessionId?: string;
  startTime?: number;
  user?: unknown;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export {};

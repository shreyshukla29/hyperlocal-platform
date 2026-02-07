import { GatewayRequestContext } from './gateway-context.type.js';

declare global {
  namespace Express {
    interface Request {
      context: GatewayRequestContext;
    }
  }
}

export {};

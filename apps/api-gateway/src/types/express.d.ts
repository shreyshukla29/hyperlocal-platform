import { GatewayRequestContext } from './gateway-context.type';

declare global {
  namespace Express {
    interface Request {
      context: GatewayRequestContext;
    }
  }
}

export {};

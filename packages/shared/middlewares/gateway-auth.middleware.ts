import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';

export interface GatewayAuthConfig {
  apiKeyHeader: string;
  validApiKey: string;
}

const apiKeyHeader = 'x-gateway-api-key';
export function createGatewayAuthMiddleware(config: GatewayAuthConfig) {
  const { validApiKey } = config;

  if (!apiKeyHeader || !validApiKey) {
   return next( new Error('GatewayAuthMiddleware misconfigured'));
  }

  return function gatewayAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const incomingKey = req.headers[apiKeyHeader.toLowerCase()] as string | undefined;

    if (!incomingKey) {
      return next(new UnauthorizedError('Missing gateway API key'));
    }

    if (incomingKey !== validApiKey) {
      return next(new UnauthorizedError('Invalid gateway API key'));
    }

    next();
  };
}

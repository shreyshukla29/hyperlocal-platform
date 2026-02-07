import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/index.js';

export interface GatewayAuthConfig {
  apiKeyHeader?: string;
  validApiKey: string;
}

const DEFAULT_API_KEY_HEADER = 'x-gateway-api-key';

export function createGatewayAuthMiddleware(config: GatewayAuthConfig) {
  const { validApiKey, apiKeyHeader = DEFAULT_API_KEY_HEADER } = config;

  if (!validApiKey) {
    throw new Error('GatewayAuthMiddleware misconfigured: validApiKey is required');
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

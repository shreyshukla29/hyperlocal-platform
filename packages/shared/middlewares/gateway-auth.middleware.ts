import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@hyperlocal/errors';

export interface GatewayAuthConfig {
  apiKeyHeader: string;
  validApiKey: string;
}

export function createGatewayAuthMiddleware(config: GatewayAuthConfig) {
  const { apiKeyHeader, validApiKey } = config;

  if (!apiKeyHeader || !validApiKey) {
    throw new Error('GatewayAuthMiddleware misconfigured');
  }

  return function gatewayAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const incomingKey = req.headers[apiKeyHeader.toLowerCase()] as string | undefined;

    if (!incomingKey) {
      throw new UnauthorizedError('Missing gateway API key');
    }

    if (incomingKey !== validApiKey) {
      throw new UnauthorizedError('Invalid gateway API key');
    }

    next();
  };
}

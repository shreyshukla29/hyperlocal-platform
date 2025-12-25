import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { ServiceName } from '../enums';
import { HEADERS } from '../constants';

const SERVICE_MAP: Record<ServiceName, string> = {
  [ServiceName.AUTH]: 'http://localhost:3001',
  [ServiceName.USER]: 'http://localhost:3002',
};

export function createServiceProxy(service: ServiceName) {
  return createProxyMiddleware({
    target: SERVICE_MAP[service],
    changeOrigin: true,
    onProxyReq(proxyReq, req: Request) {
      if (req.context.user) {
        proxyReq.setHeader(HEADERS.USER_ID, req.context.user.sub);
        proxyReq.setHeader(
          HEADERS.USER_ROLES,
          req.context.user.roles.join(','),
        );
      }
    },
  });
}

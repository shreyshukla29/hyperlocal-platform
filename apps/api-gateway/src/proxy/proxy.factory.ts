import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { ServiceName } from '../enums';
import { HEADERS,SERVICE_MAP } from '../constants';
import ServerConfig from '../config';

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
        proxyReq.setHeader(
          HEADERS.GATEWAY_API_KEY,ServerConfig.GATEWAY_API_KEY
        )
      }
    },
  });
}

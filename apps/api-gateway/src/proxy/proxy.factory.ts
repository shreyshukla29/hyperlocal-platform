import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { ServiceName } from '../enums';
import { HEADERS, SERVICE_MAP } from '../constants';
import { ServerConfig } from '../config';

export function createServiceProxy(
  service: ServiceName,
  version: 'v1' | 'v2'
) {
  console.log('here')
  return createProxyMiddleware({
    target: SERVICE_MAP[service],
    changeOrigin: true,
    pathRewrite: (path) => path.replace('', `/api/${version}/${service}`),
    on:{
      proxyReq(proxyReq, req:Request ) {
        console.log('🔥 onProxyReq fired for:', req.originalUrl);
      proxyReq.setHeader(HEADERS.GATEWAY_API_KEY,ServerConfig.GATEWAY_API_KEY);

      if (req.context.user) {
        proxyReq.setHeader(HEADERS.USER_ID, req.context.user.sub);
        proxyReq.setHeader(
          HEADERS.USER_ROLES,
          req.context.user.roles.join(',')
        );
      }
    },
    }
  });
}

import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { ServiceName } from '../enums/index.js';
import { HEADERS, SERVICE_MAP } from '../constants/index.js';
import { ServerConfig } from '../config/index.js';

export function createServiceProxy(
  service: ServiceName,
  version: 'v1' | 'v2'
) {
  const pathRewrite =
    service === ServiceName.BOOKING
      ? (path: string) => path.replace('/api/v1/booking', '/api/v1')
      : service === ServiceName.NOTIFICATION
        ? (path: string) => path.replace('/api/v1/notification', '/api/v1')
        : service === ServiceName.PROVIDER
          ? (path: string) => path
          : (path: string) => path.replace('', `/api/${version}/${service}`);
  return createProxyMiddleware({
    target: SERVICE_MAP[service],
    changeOrigin: true,
    pathRewrite,
    on:{
      proxyReq(proxyReq, req:Request ) {
      proxyReq.setHeader(HEADERS.GATEWAY_API_KEY,ServerConfig.GATEWAY_API_KEY);
      if (req.context.user) {
        proxyReq.setHeader(HEADERS.USER_ID, req.context.user.authId);
      
      }
    },
    }
  });
}

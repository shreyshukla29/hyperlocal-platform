import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { ServiceName } from '../enums/index.js';
import { HEADERS, SERVICE_MAP } from '../constants/index.js';
import { ServerConfig } from '../config/index.js';

export function createServiceProxy(service: ServiceName, version: 'v1' | 'v2') {
  const pathRewrite = (path: string) => path.replace('', `/api/${version}/${service}`);
  return createProxyMiddleware({
    target: SERVICE_MAP[service],
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq(proxyReq, req: Request) {
        proxyReq.setHeader(HEADERS.GATEWAY_API_KEY, ServerConfig.GATEWAY_API_KEY);
        const user = req.context?.user;
        if (user) {
          const authId = (user as { authId?: string }).authId ?? (user as { sub?: string }).sub;
          if (authId) proxyReq.setHeader(HEADERS.USER_ID, authId);
          const accountType = (user as { accountType?: string }).accountType;
          if (accountType) proxyReq.setHeader(HEADERS.ACCOUNT_TYPE, accountType);
        }
      },
    },
  });
}

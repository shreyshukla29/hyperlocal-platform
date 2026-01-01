import { createApp } from './app';
import { ServerConfig } from './config';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  logger.info('Auth service started', {
    port: ServerConfig.PORT,
    service: 'auth-service',
    env: ServerConfig.NODE_ENV,
  });
});

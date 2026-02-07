import { createApp } from './app.js';
import { ServerConfig } from './config/index.js';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  logger.info('Auth service started', {
    port: ServerConfig.PORT,
    service: 'auth-service',
    env: ServerConfig.NODE_ENV,
  });
});

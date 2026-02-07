import { ServerConfig } from './config/index.js';
import { createApp } from './app.js';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  logger.info(`Booking service started on port ${ServerConfig.PORT}`);
});

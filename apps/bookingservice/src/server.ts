import { ServerConfig } from './config/';
import { createApp } from './app';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  logger.info(`Booking service started on port ${ServerConfig.PORT}`);
});

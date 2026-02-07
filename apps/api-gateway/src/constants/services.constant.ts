import { ServerConfig } from '../config/index.js';
import { ServiceName } from '../enums/index.js';
export const SERVICE_MAP: Record<ServiceName, string> = {
  [ServiceName.AUTH]: ServerConfig.services.AUTH!,
  [ServiceName.USER]: ServerConfig.services.USER!,
  [ServiceName.PROVIDER]: ServerConfig.services.PROVIDER!,
  [ServiceName.BOOKING]: ServerConfig.services.BOOKING!,
  [ServiceName.NOTIFICATION]: ServerConfig.services.NOTIFICATION!,
};

import { ServerConfig } from '../config';
import { ServiceName } from '../enums';
export const SERVICE_MAP: Record<ServiceName, string> = {
  [ServiceName.AUTH]: ServerConfig.services.AUTH,
  [ServiceName.USER]: ServerConfig.services.USER,
};


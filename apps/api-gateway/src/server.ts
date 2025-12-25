import { createApp } from "./app.ts";
import { ServerConfig } from "./config/";

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  console.log(`API Gateway running on port ${ServerConfig.PORT}`);
});

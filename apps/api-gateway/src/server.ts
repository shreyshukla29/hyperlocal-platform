import { createApp } from "./app.js";
import { ServerConfig } from "./config/index.js";

const app = createApp();

app.listen(ServerConfig.PORT, () => {
  console.log(`API Gateway running on port ${ServerConfig.PORT}`);
});

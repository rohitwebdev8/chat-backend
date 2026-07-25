import app from './app.js';
import { config } from './config/env.js';

const HOST = '0.0.0.0';

app.listen(config.port, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 Chat Notification Server listening on ${HOST}:${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

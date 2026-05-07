// Starts the server to be listened to

import 'dotenv/config';

import { app } from './app.js';
import { env } from './config/env.js';

try {
  app.listen(env.expressPort, () => {
    console.log(`Server running on port ${env.expressPort}`);
  });
} catch (error) {
  console.error(`Failed to start server: ${error}`);
  process.exit(1);
}

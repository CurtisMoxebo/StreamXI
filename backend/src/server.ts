import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.BACKEND_PORT || config.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`StreamXI Backend running in [${config.NODE_ENV}] mode on http://localhost:${PORT}`);
  logger.info(`Domain target: https://${config.DOMAIN}`);
  logger.info(`AI Model configured: ${config.GEMINI_MODEL}`);
  logger.info(`IPTV Xtream endpoint: ${config.XTREAM_URL}`);
});

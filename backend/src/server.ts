import { app } from './app.js';
import { config } from './config/env.js';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`⚽ StreamXI Backend running in [${config.NODE_ENV}] mode on http://localhost:${PORT}`);
  console.log(`📡 Domain target: https://${config.DOMAIN}`);
  console.log(`🤖 AI Model configured: ${config.GEMINI_MODEL}`);
  console.log(`📺 IPTV Xtream endpoint: ${config.XTREAM_URL}`);
});

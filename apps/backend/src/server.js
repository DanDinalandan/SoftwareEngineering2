import { createApp } from './app.js';
import { assertConfig, config } from './config.js';

assertConfig();

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Unvapeify API running on http://0.0.0.0:${config.port}`);
});


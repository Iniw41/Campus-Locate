import app from './app.js';
import { config } from './config/index.js';
app.listen(config.port, () => console.log(`Campus Locate API on http://localhost:${config.port}`));

import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);
export default app;

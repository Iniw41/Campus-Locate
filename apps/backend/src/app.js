import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/v1', routes);
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    name: 'Campus Locate API',
    endpoints: {
      userLostAndFound: '/api/v1/user/lost-and-found',
      adminAuthLogin: '/api/v1/admin/auth/login (POST)',
      adminLostAndFound: '/api/v1/admin/lost-and-found'
    }
  });
});
app.use(errorHandler);
export default app;

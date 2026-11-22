// Environment + CORS settings. Both frontend origins are allowed to call this one API.
export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  corsOrigins: [process.env.USER_ORIGIN || 'http://localhost:5173', process.env.ADMIN_ORIGIN || 'http://localhost:5174'],
};

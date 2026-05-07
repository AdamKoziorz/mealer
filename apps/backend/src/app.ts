// This file configures the express app
//
// Data Transfer Layers:
// Routes -> Controllers -> Services -> Repos
//           (http)         (logic)     (db)

import express from 'express';
import { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import userRoutes from './modules/user/user.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { authUser } from './middleware/auth.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Express = express();

if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // MapLibre injects inline styles
        imgSrc: ["'self'", 'data:', 'blob:'],
        workerSrc: ["'self'", 'blob:'], // MapLibre web workers
        connectSrc: ["'self'", 'https://tiles.openfreemap.org/'],
        fontSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  express.json({
    limit: '10kb',
  })
);
app.use(authUser);

// Routes
app.use('/user', userRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

export { app };

import ApiGateway from 'moleculer-web';
import dotenv from 'dotenv';
import { loadEnv } from '../utils/env';
import { buildBasicAuthHook } from '../utils/auth';

dotenv.config();
const env = loadEnv();
const onBeforeCallAuth = buildBasicAuthHook(env);

/**
 * API Gateway service.
 *
 * Exposes HTTP endpoints under "/" and "/api" mapping to Moleculer actions.
 */
const ApiService = {
  name: 'api',
  mixins: [ApiGateway as any],
  settings: {
    ip: '0.0.0.0',
    port: env.PORT,
    routes: [
      {
        path: '/',
        aliases: {
          'GET health': 'health.check',
        },
        bodyParsers: {
          json: { strict: true, limit: '2mb' },
          urlencoded: { extended: true, limit: '2mb' },
        },
        cors: {
          origin: '*',
          methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: [],
          credentials: false,
          maxAge: 3600,
        },
        onBeforeCall: (ctx, route, req, res) => {
            // No authentication for health check
            if (req.url === '/health') return;
            // Use the basic auth hook for all other routes
            onBeforeCallAuth(ctx, route, req, res);
        }
      },
      {
        path: '/api',
        aliases: {
          'GET books/search': 'books.search',
          'GET books/last-search': 'books.lastSearch',
          'POST books/my-library': 'books.create',
          'GET books/my-library': 'books.list',
          'GET books/my-library/:id': 'books.get',
          'PUT books/my-library/:id': 'books.update',
          'DELETE books/my-library/:id': 'books.remove',
          'GET books/library/front-cover/:id': 'books.frontCover',
        },
        bodyParsers: {
          json: { strict: true, limit: '2mb' },
          urlencoded: { extended: true, limit: '2mb' },
        },
        cors: {
          origin: '*',
          methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: [],
          credentials: false,
          maxAge: 3600,
        },
        onBeforeCall: onBeforeCallAuth,
      },
    ],
  },
};

export default ApiService;
